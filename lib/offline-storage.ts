import { Student, PendingSyncViolation } from '@/types';

const DB_NAME = 'unikontrol_offline_db';
const DB_VERSION = 1;
const STUDENTS_STORE = 'cached_students';
const SYNC_QUEUE_STORE = 'sync_queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STUDENTS_STORE)) {
        const studentStore = db.createObjectStore(STUDENTS_STORE, { keyPath: 'id' });
        studentStore.createIndex('ogrenci_no', 'ogrenci_no', { unique: false });
        studentStore.createIndex('ad_soyad', 'ad_soyad', { unique: false });
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'client_transaction_id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheStudentsLocally(students: Student[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STUDENTS_STORE, 'readwrite');
    const store = tx.objectStore(STUDENTS_STORE);
    students.forEach((s) => store.put(s));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to cache students:', err);
  }
}

export async function searchLocalStudents(query: string): Promise<Student[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STUDENTS_STORE, 'readonly');
    const store = tx.objectStore(STUDENTS_STORE);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const all: Student[] = request.result || [];
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) {
          resolve(all.slice(0, 20));
          return;
        }
        const filtered = all.filter(
          (s) =>
            s.ogrenci_no.toLowerCase().includes(trimmed) ||
            s.ad_soyad.toLowerCase().includes(trimmed)
        );
        resolve(filtered.slice(0, 20));
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Local student search error:', err);
    return [];
  }
}

export async function addPendingViolation(violation: PendingSyncViolation): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    store.put(violation);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to add pending violation:', err);
  }
}

export async function getPendingViolations(): Promise<PendingSyncViolation[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
    const store = tx.objectStore(SYNC_QUEUE_STORE);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Failed to get pending violations:', err);
    return [];
  }
}

export async function removePendingViolation(client_transaction_id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);
    store.delete(client_transaction_id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to remove pending violation:', err);
  }
}
