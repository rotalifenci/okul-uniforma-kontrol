'use client';

import React from 'react';
import { Menu, QrCode, School, Shield, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { ConnectionStatusBadge } from './connection-status-badge';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';

interface AppHeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenQr?: () => void;
  title?: string;
}

export function AppHeader({ onToggleMobileMenu, onOpenQr, title }: AppHeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/85 backdrop-blur-md px-4 md:px-6">
      {onToggleMobileMenu && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMobileMenu}
          className="md:hidden text-muted-foreground hover:text-foreground"
          aria-label="Menüyü aç"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* School Brand & Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Link href={user?.role === 'ADMIN' ? '/admin' : '/teacher'} className="flex items-center gap-2 flex-shrink-0">
          <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 border border-border flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Okul Logosu" className="h-full w-full object-contain" />
          </div>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground tracking-tight truncate">
            {title || 'Sivas Mehmet Akif İnan Ortaokulu'}
          </h1>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium hidden xs:block truncate">
            Okul Üniforma & Kılık-Kıyafet Takip Sistemi
          </p>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2">
        <ConnectionStatusBadge />

        {onOpenQr && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenQr}
            className="hidden sm:flex items-center gap-1.5 h-9 rounded-xl border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            title="Mobil Giriş QR Kodu"
          >
            <QrCode className="h-4 w-4" />
            <span className="text-xs font-semibold">QR Giriş</span>
          </Button>
        )}

        <ThemeToggle />

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-foreground block">
                {user.name} {user.surname}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">
                {user.role === 'ADMIN' ? 'Yönetici' : 'Nöbetçi Öğretmen'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => useAuthStore.getState().logout()}
              className="h-9 px-3 rounded-xl border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1.5 font-bold text-xs shadow-sm transition-all"
              title="Güvenli Çıkış Yap"
            >
              <LogOut className="h-4 w-4" />
              <span>Çıkış</span>
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button size="sm" className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
              Giriş Yap
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
