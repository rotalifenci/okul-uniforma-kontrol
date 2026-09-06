import { create } from 'zustand';
import { PendingSyncViolation } from '@/types';
import { addPendingViolation, getPendingViolations, removePendingViolation } from '@/lib/offline-storage';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  pendingList: PendingSyncViolation[];
  setIsOnline: (online: boolean) => void;
  loadPendingList: () => Promise<void>;
  queueViolation: (violation: Omit<PendingSyncViolation, 'status' | 'created_at'>) => Promise<void>;
  syncNow: () => Promise<{ success: boolean; synced: number; failed: number }>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  pendingList: [],

  setIsOnline: (isOnline) => {
    set({ isOnline });
    if (isOnline) {
      get().syncNow();
    }
  },

  loadPendingList: async () => {
    try {
      const list = await getPendingViolations();
      set({ pendingList: list, pendingCount: list.length });
    } catch (e) {
      console.warn(e);
    }
  },

  queueViolation: async (data) => {
    const item: PendingSyncViolation = {
      ...data,
      created_at: Date.now(),
      status: 'pending',
    };
    await addPendingViolation(item);
    await get().loadPendingList();

    // If online, trigger background sync
    if (get().isOnline) {
      get().syncNow();
    }
  },

  syncNow: async () => {
    const { pendingList, isSyncing } = get();
    if (isSyncing || pendingList.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }

    set({ isSyncing: true });

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingList }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const { synced, failed } = json.data;

        // Remove successfully synced items from IndexedDB
        if (Array.isArray(synced)) {
          for (const s of synced) {
            await removePendingViolation(s.client_transaction_id);
          }
        }

        await get().loadPendingList();
        set({ isSyncing: false });
        return { success: true, synced: synced?.length || 0, failed: failed?.length || 0 };
      } else {
        set({ isSyncing: false });
        return { success: false, synced: 0, failed: pendingList.length };
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
      set({ isSyncing: false });
      return { success: false, synced: 0, failed: pendingList.length };
    }
  },
}));
