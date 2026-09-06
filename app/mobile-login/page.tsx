'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { School, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function MobileLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setUser } = useAuthStore();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Geçersiz veya eksik QR oturum kodu.');
      return;
    }

    const verifyQr = async () => {
      try {
        const res = await fetch('/api/qr/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (data.success && data.data) {
          setUser(data.data.user);
          setStatus('success');
          setTimeout(() => {
            router.replace(data.data.redirectTo || '/teacher');
          }, 800);
        } else {
          setStatus('error');
          setErrorMessage(data.message || 'QR kod süresi dolmuş veya geçersiz.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('Sunucuya bağlanırken bir hata oluştu.');
      }
    };

    verifyQr();
  }, [token, router, setUser]);

  return (
    <div className="w-full max-w-sm p-6 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-5">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
        <School className="h-9 w-9" />
      </div>

      <h1 className="text-xl font-bold">Mobil Hızlı Giriş</h1>

      {status === 'verifying' && (
        <div className="py-6 space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-slate-300">QR oturum kodu doğrulanıyor...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-6 space-y-3 text-emerald-400">
          <CheckCircle2 className="h-12 w-12 mx-auto animate-bounce" />
          <p className="text-base font-bold">Giriş Başarılı!</p>
          <p className="text-xs text-slate-400">Nöbetçi öğretmen ekranına yönlendiriliyorsunuz...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="py-4 space-y-4 text-rose-400">
          <XCircle className="h-12 w-12 mx-auto" />
          <p className="text-sm font-semibold">{errorMessage}</p>
          <Link href="/login">
            <Button variant="outline" className="w-full text-white border-slate-600 hover:bg-slate-700 mt-2">
              Normal Giriş Yap
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function MobileLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-white">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-xs text-slate-400">Yükleniyor...</p>
        </div>
      }>
        <MobileLoginContent />
      </Suspense>
    </div>
  );
}
