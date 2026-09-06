'use client';

import React, { useEffect } from 'react';
import { useSyncStore } from '@/stores/useSyncStore';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatusBadge() {
  const { isOnline, isSyncing, pendingCount, setIsOnline, loadPendingList, syncNow } = useSyncStore();

  useEffect(() => {
    loadPendingList();

    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, loadPendingList]);

  if (!isOnline) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shadow-sm"
        title="İnternet bağlantısı yok. Kayıtlar cihazınıza kaydedilecek ve bağlantı geldiğinde otomatik gönderilecek."
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <WifiOff className="h-3.5 w-3.5" />
        <span>Çevrimdışı {pendingCount > 0 ? `(${pendingCount} kuyrukta)` : ''}</span>
      </div>
    );
  }

  if (pendingCount > 0 || isSyncing) {
    return (
      <button
        onClick={() => syncNow()}
        disabled={isSyncing}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 hover:bg-amber-500/25 transition-colors shadow-sm"
        title="Bekleyen kayıtları şimdi senkronize et"
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>{isSyncing ? 'Senkronize ediliyor...' : `${pendingCount} bekliyor (Eşitle)`}</span>
      </button>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60"
      title="Sistem çevrimiçi ve veritabanı ile senkronize."
    >
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Wifi className="h-3 w-3" />
      <span className="hidden sm:inline">Çevrimiçi</span>
    </div>
  );
}
