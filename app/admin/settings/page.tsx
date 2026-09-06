'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  School,
  ShieldCheck,
  Clock,
  QrCode,
  Save,
  CheckCircle2,
  Lock,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    school_name: 'Atatürk Anadolu Lisesi',
    school_logo_url: '',
    repeat_violation_threshold: '2',
    special_followup_threshold: '3',
    qr_validity_seconds: '60',
    day_closure_time: '17:00',
  });
  const [violationTypes, setViolationTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosingDay, setIsClosingDay] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success && json.data) {
          setSettings((prev) => ({ ...prev, ...json.data.settings }));
          setViolationTypes(json.data.violationTypes || []);
        }
      } catch {
        toast.error('Ayarlar yüklenemedi.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Sistem ayarları başarıyla kaydedildi.');
      } else {
        toast.error(json.message || 'Ayarlar kaydedilemedi.');
      }
    } catch {
      toast.error('İşlem başarısız.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDay = async () => {
    if (!confirm('Bugün için gün sonu kapanışı yapmak istediğinize emin misiniz? Günlük istatistikler denetim kütüğüne kaydedilecek.')) return;

    setIsClosingDay(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE_DAY' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Gün sonu kapanışı başarıyla tamamlandı.');
      } else {
        toast.error(json.message || 'Gün sonu işlemi yapılamadı.');
      }
    } catch {
      toast.error('İşlem sırasında bir sorun oluştu.');
    } finally {
      setIsClosingDay(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Ayarlar yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Sistem & Okul Ayarları
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Okul bilgilerini, eşik değerlerini ve gün sonu kapanış parametrelerini yapılandırın
          </p>
        </div>

        {/* Day Closure Button */}
        <Button
          onClick={handleCloseDay}
          disabled={isClosingDay}
          variant="outline"
          className="font-bold border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 rounded-xl h-10 shadow-sm"
        >
          <Lock className="h-4 w-4 mr-1.5" /> {isClosingDay ? 'Kapatılıyor...' : 'Günü Kapat (Gün Sonu)'}
        </Button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* School Info Card */}
        <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-blue-600">
              <School className="h-5 w-5" />
              <CardTitle className="text-base font-bold text-foreground">Okul Bilgileri</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Raporlarda ve giriş ekranlarında görüntülenecek kurum bilgileri
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Okul Tam Adı</label>
                <Input
                  type="text"
                  value={settings.school_name || ''}
                  onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                  placeholder="Örn: Atatürk Anadolu Lisesi"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Okul Logo URL (İsteğe bağlı)</label>
                <Input
                  type="text"
                  value={settings.school_logo_url || ''}
                  onChange={(e) => setSettings({ ...settings, school_logo_url: e.target.value })}
                  placeholder="https://... (boş bırakılabilir)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thresholds & Rules Card */}
        <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
              <CardTitle className="text-base font-bold text-foreground">Denetim & Takip Eşikleri</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tekrarlayan ihlal rozetleri ve QR oturum güvenlik süreleri
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  🔴 Tekrarlayan İhlal Eşiği (Haftalık)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.repeat_violation_threshold || '2'}
                  onChange={(e) => setSettings({ ...settings, repeat_violation_threshold: e.target.value })}
                  required
                />
                <p className="text-[11px] text-muted-foreground">Bu sayıya ulaşan öğrencide kırmızı rozet belirir (Varsayılan: 2)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  🚨 Özel Takip Eşiği (Dashboard)
                </label>
                <Input
                  type="number"
                  min={2}
                  max={20}
                  value={settings.special_followup_threshold || '3'}
                  onChange={(e) => setSettings({ ...settings, special_followup_threshold: e.target.value })}
                  required
                />
                <p className="text-[11px] text-muted-foreground">Dashboard özel takip listesine ekleme eşiği (Varsayılan: 3)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  📱 Mobil QR Geçerlilik Süresi (Saniye)
                </label>
                <Input
                  type="number"
                  min={15}
                  max={300}
                  value={settings.qr_validity_seconds || '60'}
                  onChange={(e) => setSettings({ ...settings, qr_validity_seconds: e.target.value })}
                  required
                />
                <p className="text-[11px] text-muted-foreground">Oluşturulan dinamik QR kodun kullanım ömrü (Varsayılan: 60)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl shadow-md"
          >
            <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
