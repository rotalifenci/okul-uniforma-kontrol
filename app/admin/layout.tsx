'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AppHeader } from '@/components/app-header';
import { QrLoginModal } from '@/components/qr-modal';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'ADMIN') {
        router.replace('/teacher');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm font-semibold text-muted-foreground animate-pulse">
          Yönetici paneli yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <AdminSidebar
        openMobile={openMobileMenu}
        onCloseMobile={() => setOpenMobileMenu(false)}
        onOpenQr={() => setShowQrModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <AppHeader
          onToggleMobileMenu={() => setOpenMobileMenu(true)}
          onOpenQr={() => setShowQrModal(true)}
        />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      <QrLoginModal open={showQrModal} onOpenChange={setShowQrModal} />
    </div>
  );
}
