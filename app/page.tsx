'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { School, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth().then((currentUser) => {
      if (currentUser) {
        if (currentUser.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/teacher');
        }
      } else {
        router.replace('/login');
      }
    });
  }, [checkAuth, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl animate-bounce">
          <School className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Okul Üniforma Kontrol Sistemi</h1>
        <p className="text-sm text-slate-400">ÜniKontrol başlatılıyor...</p>
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mt-2" />
      </div>
    </div>
  );
}
