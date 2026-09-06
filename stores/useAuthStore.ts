import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    set({ user: null, credentialsCleared: true } as any);
    window.location.href = '/login';
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.data) {
        set({ user: data.data, isLoading: false });
        return data.data;
      } else {
        set({ user: null, isLoading: false });
        return null;
      }
    } catch {
      set({ user: null, isLoading: false });
      return null;
    }
  },
}));
