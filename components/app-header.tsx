'use client';

import React from 'react';
import { Menu, School, Shield, User as UserIcon, LogOut, Search, ClipboardList, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { ConnectionStatusBadge } from './connection-status-badge';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenQr?: () => void;
  title?: string;
}

export function AppHeader({ onToggleMobileMenu, title }: AppHeaderProps) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/85 backdrop-blur-md px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMobileMenu}
            className="md:hidden text-muted-foreground hover:text-foreground h-9 w-9"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* School Brand & Title */}
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

      {/* Desktop Main Navigation Links */}
      {user && (
        <div className="hidden md:flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
          <Link
            href="/teacher"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
              pathname === '/teacher'
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Hızlı İhlal</span>
          </Link>
          <Link
            href="/teacher/history"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
              pathname === '/teacher/history'
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Kayıtlarım</span>
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                pathname.startsWith('/admin')
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/80"
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Yönetici Paneli</span>
            </Link>
          )}
        </div>
      )}

      {/* Status & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ConnectionStatusBadge />
        <ThemeToggle />

        {user ? (
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden lg:block text-right">
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
