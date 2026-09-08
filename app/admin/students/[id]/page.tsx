'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  GraduationCap,
  AlertTriangle,
  FileText,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Student, Violation } from '@/types';
import { formatDateTR, VIOLATION_TYPE_MAP } from '@/lib/utils';
import { toast } from 'sonner';

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [student, setStudent] = useState<Student & { violations?: Violation[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudent() {
      if (!studentId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/students/${studentId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setStudent(json.data);
        }
      } catch {
        toast.error('Öğrenci detayları yüklenemedi.');
      } finally {
        setIsLoading(false);
      }
    }
    loadStudent();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="space-y-6 py-8 text-center text-muted-foreground text-sm">
        Öğrenci profili yükleniyor...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4 text-center py-12">
        <p className="text-base font-bold text-foreground">Öğrenci bulunamadı.</p>
        <Link href="/admin/students">
          <Button variant="outline" size="sm">Öğrenci Listesine Dön</Button>
        </Link>
      </div>
    );
  }

  const allViolations = student.violations || [];
  const weeklyCount = student.weekly_violations_count || 0;
  const totalCount = student.violations_count || allViolations.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Öğrenci Listesine Dön
        </Link>
      </div>

      {/* Student Profile Card */}
      <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center font-black text-blue-700 dark:text-blue-300 text-2xl overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow flex-shrink-0">
                {student.profil_resmi_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={student.profil_resmi_url} alt={student.ad_soyad} className="w-full h-full object-cover" />
                ) : (
                  student.ad_soyad[0]
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-foreground tracking-tight">
                    {student.ad_soyad}
                  </h1>
                  {student.is_repeat_offender && (
                    <Badge variant="repeat" className="text-xs font-bold py-1 px-2.5">
                      🔴 Tekrarlayan İhlal ({weeklyCount})
                    </Badge>
                  )}
                  <Badge variant={student.aktif ? 'success' : 'secondary'} className="text-xs">
                    {student.aktif ? 'Aktif Öğrenci' : 'Pasif'}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground font-semibold flex-wrap">
                  <span>Sınıf: <strong className="text-foreground">{student.sinif}-{student.sube}</strong></span>
                  <span>•</span>
                  <span>Öğrenci No: <strong className="text-blue-600 dark:text-blue-400">{student.ogrenci_no}</strong></span>
                  {student.cinsiyet && (
                    <>
                      <span>•</span>
                      <span>{student.cinsiyet}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Pills */}
            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-around sm:justify-start bg-muted/40 p-3 rounded-2xl border border-border/80">
              <div className="text-center px-3">
                <span className="text-[11px] font-bold text-muted-foreground block">Bu Hafta</span>
                <span className={`text-xl font-black ${weeklyCount >= 2 ? 'text-rose-600' : 'text-foreground'}`}>
                  {weeklyCount}
                </span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center px-3">
                <span className="text-[11px] font-bold text-muted-foreground block">Toplam</span>
                <span className="text-xl font-black text-foreground">{totalCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chronological Violations History */}
      <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-border">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Kronolojik İhlal Geçmişi ({allViolations.length} Kayıt)
          </CardTitle>
          <CardDescription className="text-xs">
            Öğrencinin okul başlangıcından itibaren kaydedilen tüm denetim geçmişi
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5">
          {allViolations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Bu öğrenciye ait kayıtlı bir kılık-kıyafet ihlali bulunmuyor.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-blue-500/30 space-y-6">
              {allViolations.map((v) => {
                const typeInfo = VIOLATION_TYPE_MAP[v.type];
                return (
                  <div key={v.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-blue-600 bg-white dark:bg-slate-900 group-hover:scale-125 transition-transform" />

                    <div className="bg-muted/30 hover:bg-muted/60 transition-colors p-4 rounded-2xl border border-border/70 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={typeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}>
                            {typeInfo?.label || v.type}
                          </Badge>
                          {v.is_cancelled && (
                            <Badge variant="destructive" className="text-[10px]">İptal Edilmiş</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" />
                          <span>{formatDateTR(v.date)}</span>
                          <span>•</span>
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          <span>{v.time}</span>
                        </div>
                      </div>

                      {v.note && (
                        <div className="text-xs text-muted-foreground bg-background/80 p-2.5 rounded-xl border border-border flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                          <span>{v.note}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-muted-foreground font-medium pt-1">
                        Kayıt Yapan Nöbetçi: <strong>{v.teacher ? `${v.teacher.name} ${v.teacher.surname}` : 'Öğretmen'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
