'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, Smartphone, ShieldCheck, Clock } from 'lucide-react';
import Image from 'next/image';

export function QrLoginModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [validity, setValidity] = useState<number>(60);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generateQr = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/qr/create', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setQrDataUrl(json.data.qrDataUrl);
        setLoginUrl(json.data.loginUrl);
        setValidity(json.data.validitySeconds || 60);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      generateQr();
    } else {
      setQrDataUrl(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || validity <= 0) return;
    const timer = setInterval(() => {
      setValidity((v) => {
        if (v <= 1) {
          generateQr(); // Auto refresh when expired
          return 60;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, validity]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Smartphone className="h-6 w-6" />
          <DialogTitle>Mobil Hızlı Giriş QR Kodu</DialogTitle>
        </div>
        <DialogDescription>
          Telefonunuzun kamerasını bu QR koda tutarak şifre girmeden nöbetçi öğretmen ekranına saniyeler içinde bağlanabilirsiniz.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-2xl border border-border">
        {isLoading && !qrDataUrl ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Güvenli QR token oluşturuluyor...</p>
          </div>
        ) : qrDataUrl ? (
          <div className="flex flex-col items-center">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="Mobil Giriş QR Kodu"
                className="w-56 h-56 object-contain"
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
              <span>Kalan Süre: <strong className="text-blue-600 font-bold">{validity} sn</strong></span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Süre dolduğunda QR kod otomatik yenilenir.</p>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-destructive">QR kod oluşturulamadı.</p>
            <Button onClick={generateQr} variant="outline" size="sm" className="mt-3">
              Tekrar Dene
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground bg-blue-50/70 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>Tek kullanımlık şifreli oturum tokeni.</span>
        </div>
        <Button variant="ghost" size="sm" onClick={generateQr} disabled={isLoading} className="h-7 text-xs">
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
        </Button>
      </div>
    </Dialog>
  );
}
