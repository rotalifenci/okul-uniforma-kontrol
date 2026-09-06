'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  AlertTriangle,
  CalendarDays,
  FileSpreadsheet,
  UploadCloud,
  Settings,
  ShieldAlert,
  LogOut,
  QrCode,
  Search,
  School,
  X
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface AdminSidebarProps {
  openMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenQr?: () => void;
}

export function AdminSidebar({ openMobile, onCloseMobile, onOpenQr }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Hızlı İhlal Girişi', href: '/teacher', icon: Search, badge: 'Nöbet' },
    { name: 'Öğrenci Yönetimi', href: '/admin/students', icon: GraduationCap },
    { name: 'İhlal Kayıtları', href: '/admin/violations', icon: AlertTriangle },
    { name: 'Haftalık Takvim', href: '/admin/calendar', icon: CalendarDays },
    { name: 'Raporlar & Analiz', href: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Toplu İçe Aktar', href: '/admin/imports', icon: UploadCloud },
    { name: 'Öğretmenler', href: '/admin/teachers', icon: Users },
    { name: 'Sistem Ayarları', href: '/admin/settings', icon: Settings },
    { name: 'Audit Log (Denetim)', href: '/admin/audit-logs', icon: ShieldAlert },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 group min-w-0">
          <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-border flex items-center justify-center p-0.5 shadow-sm flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Okul Logosu" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-xs tracking-tight text-foreground block truncate">
              Sivas M. Akif İnan OO
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block">
              Yönetim Paneli
            </span>
          </div>
        </Link>
        {openMobile && (
          <Button variant="ghost" size="icon" onClick={onCloseMobile} className="md:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className={cn(
                  "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                  isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick QR & User Card */}
      <div className="p-4 border-t border-border space-y-3 bg-muted/20">
        {onOpenQr && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenQr}
            className="w-full flex items-center justify-center gap-2 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-medium"
          >
            <QrCode className="h-4 w-4" />
            <span>Mobil Giriş QR Kodu</span>
          </Button>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
              {user?.name?.[0] || 'Y'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user ? `${user.name} ${user.surname}` : 'Yönetici'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                @{user?.username || 'admin'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Güvenli Çıkış"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {openMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-4/5 max-w-xs h-full z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
