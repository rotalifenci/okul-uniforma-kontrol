'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { Violation } from '@/types';
import { formatDateTR, VIOLATION_TYPE_MAP } from '@/lib/utils';
import { AppHeader } from '@/components/app-header';
import { TeacherBottomNav } from '@/components/teacher-bottom-nav';
import { QrLoginModal } from '@/components/qr-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, Clock, ArrowLeft, Calendar, FileText, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TeacherHistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'today' | 'week'>('today');
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const fetchViolations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/violations?myOnly=true&limit=50');
      const json = await res.json();
      if (json.success && json.data?.items) {
        setViolations(json.data.items);
      }
    } catch (e) {
      toast.error('Kayıtlar yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchViolations();
    }
  }, [user]);

  const handleCancelViolation = async (id: string) => {
    if (!confirm('Bu ihlal kaydını iptal etmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/violations/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Öğretmen tarafından iptal edildi.' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('İhlal kaydı iptal edildi.');
        fetchViolations();
      } else {
        toast.error(json.message || 'İptal edilemedi.');
      }
    } catch {
      toast.error('İşlem sırasında hata oluştu.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredViolations = violations.filter((v) => {
    if (filterTab === 'today') {
      return v.date === todayStr;
    }
    return true; // week / all
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-8 flex flex-col">
      <AppHeader
        title="Girdiğim İhlal Kayıtları"
        onOpenQr={() => setShowQrModal(true)}
      />

      <main className="flex-1 max-w-lg w-full mx-auto p-3 sm:p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/teacher" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Hızlı Kayıt Ekranına Dön
          </Link>
          <span className="text-xs font-semibold text-muted-foreground">
            Toplam: <strong>{filteredViolations.length} kayıt</strong>
          </span>
        </div>

        {/* Tab Filter */}
        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as any)}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="today">Bugünkü Kayıtlarım</TabsTrigger>
            <TabsTrigger value="week">Bu Haftaki Tüm Kayıtlarım</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Records List */}
        {isLoading ? (
          <div className="space-y-3 py-6 text-center text-muted-foreground text-sm">
            Kayıtlar yükleniyor...
          </div>
        ) : filteredViolations.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground rounded-2xl border-dashed">
            <p className="text-sm font-semibold">
              {filterTab === 'today' ? 'Bugün henüz bir kılık-kıyafet ihlali kaydetmediniz.' : 'Bu hafta için kayıt bulunamadı.'}
            </p>
            <Link href="/teacher">
              <Button size="sm" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                Yeni İhlal Kaydet
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredViolations.map((v) => {
              const typeInfo = VIOLATION_TYPE_MAP[v.type];
              return (
                <Card key={v.id} className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card hover:shadow transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-sm overflow-hidden flex-shrink-0">
                          {v.student?.profil_resmi_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.student.profil_resmi_url} alt={v.student.ad_soyad} className="w-full h-full object-cover" />
                          ) : (
                            v.student?.ad_soyad[0] || 'Ö'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{v.student?.ad_soyad}</p>
                          <p className="text-xs text-muted-foreground font-medium">
                            No: <strong className="text-blue-600 dark:text-blue-400">{v.student?.ogrenci_no}</strong> • {v.student?.sinif}-{v.student?.sube}
                          </p>
                        </div>
                      </div>

                      <Badge className={typeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}>
                        {typeInfo?.shortLabel || v.type}
                      </Badge>
                    </div>

                    {v.note && (
                      <div className="bg-muted/50 p-2.5 rounded-xl text-xs text-muted-foreground flex items-start gap-2">
                        <FileText className="h-3.5 w-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                        <span>{v.note}</span>
                      </div>
                    )}

                    {(v.duty_teacher_name || v.duty_location) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {v.duty_teacher_name && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                            👨‍🏫 {v.duty_teacher_name}
                          </span>
                        )}
                        {v.duty_location && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                            📍 {v.duty_location}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDateTR(v.date)}</span>
                        <span>•</span>
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{v.time}</span>
                      </div>

                      {!v.is_cancelled ? (
                        <button
                          type="button"
                          onClick={() => handleCancelViolation(v.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> İptal Et
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-rose-500">İptal Edildi</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <QrLoginModal open={showQrModal} onOpenChange={setShowQrModal} />
      <TeacherBottomNav onOpenQr={() => setShowQrModal(true)} />
    </div>
  );
}
