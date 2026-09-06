'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ClipboardList, LogOut, QrCode } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils';

export function TeacherBottomNav({ onOpenQr }: { onOpenQr?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const navItems = [
    {
      href: '/teacher',
      label: 'Hızlı İhlal',
      icon: Search,
      active: pathname === '/teacher',
    },
    {
      href: '/teacher/history',
      label: 'Kayıtlarım',
      icon: ClipboardList,
      active: pathname === '/teacher/history',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg md:hidden">
      <div className="grid grid-cols-3 h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors select-none",
                item.active
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-all",
                item.active ? "bg-blue-100/70 dark:bg-blue-900/40 scale-110" : ""
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => logout()}
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors select-none"
        >
          <div className="p-1 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all">
            <LogOut className="h-5 w-5" />
          </div>
          <span>Çıkış</span>
        </button>
      </div>
    </nav>
  );
}
