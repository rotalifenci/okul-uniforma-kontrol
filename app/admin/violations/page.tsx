'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Clock,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Violation } from '@/types';
import { formatDateTR, VIOLATION_TYPE_MAP } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Cancel Dialog
  const [cancelTarget, setCancelTarget] = useState<Violation | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchViolations = async () => {
    setIsLoading(true);
    try {
      let url = `/api/violations?page=${page}&limit=${limit}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (selectedType) url += `&type=${selectedType}`;
      if (selectedClass) url += `&sinif=${selectedClass}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setViolations(json.data.items);
        setTotal(json.data.total);
        setTotalPages(json.data.totalPages);
      }
    } catch {
      toast.error('Kayıtlar yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [page, limit, startDate, endDate, selectedType, selectedClass]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    try {
      const res = await fetch(`/api/violations/${cancelTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() || 'Yönetici tarafından iptal edildi.' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('İhlal kaydı iptal edildi.');
        setCancelTarget(null);
        setCancelReason('');
        fetchViolations();
      } else {
        toast.error(json.message || 'İptal edilemedi.');
      }
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            İhlal Kayıtları
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Öğretmenler tarafından sisteme girilen tüm denetim ve ihlal kayıtları
          </p>
        </div>

        <Link href="/teacher">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 shadow-sm">
            <AlertTriangle className="h-4 w-4 mr-1.5" /> + Yeni İhlal Gir
          </Button>
        </Link>
      </div>

      {/* Filter Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Tarih:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs w-36 rounded-xl"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-10 text-xs w-36 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 flex-1"
            >
              <option value="">Tüm İhlal Türleri</option>
              <option value="UPPER_UNIFORM_MISSING">Üst Forma Eksik</option>
              <option value="LOWER_UNIFORM_MISSING">Alt Forma Eksik</option>
              <option value="CIVIL_CLOTHES">Tamamen Sivil / Uygunsuz</option>
              <option value="INAPPROPRIATE_CLOTHING">Kılık-Kıyafet Uygunsuz</option>
              <option value="OTHER">Diğer İhlal</option>
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 w-32"
            >
              <option value="">Tüm Sınıflar</option>
              <option value="5">5. Sınıflar</option>
              <option value="6">6. Sınıflar</option>
              <option value="7">7. Sınıflar</option>
              <option value="8">8. Sınıflar</option>
              <option value="9">9. Sınıflar</option>
              <option value="10">10. Sınıflar</option>
              <option value="11">11. Sınıflar</option>
              <option value="12">12. Sınıflar</option>
            </select>

            {(startDate || endDate || selectedType || selectedClass) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedType('');
                  setSelectedClass('');
                  setPage(1);
                }}
                className="text-xs h-10"
              >
                Sıfırla
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">
            Toplam {total} İhlal Kaydı
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Sayfa Başı:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase border-b border-border">
              <tr>
                <th className="p-3.5 pl-5">Tarih / Saat</th>
                <th className="p-3.5">Öğrenci</th>
                <th className="p-3.5">Sınıf/Şube</th>
                <th className="p-3.5">İhlal Türü</th>
                <th className="p-3.5">Nöbetçi Öğretmen</th>
                <th className="p-3.5">Not</th>
                <th className="p-3.5 text-right pr-5">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Kayıtlar yükleniyor...
                  </td>
                </tr>
              ) : violations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Filtreye uygun ihlal kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                violations.map((v) => {
                  const typeInfo = VIOLATION_TYPE_MAP[v.type];
                  return (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 pl-5 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold">{formatDateTR(v.date)}</span>
                          <span className="text-muted-foreground">{v.time}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {v.student ? (
                          <Link href={`/admin/students/${v.student.id}`} className="font-bold text-foreground hover:text-blue-600 block">
                            {v.student.ad_soyad}
                            <span className="text-xs text-muted-foreground font-normal ml-1.5">
                              (No: {v.student.ogrenci_no})
                            </span>
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3.5">
                        {v.student ? (
                          <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-bold">
                            {v.student.sinif}-{v.student.sube}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge className={typeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}>
                          {typeInfo?.label || v.type}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-xs font-medium text-muted-foreground">
                        <div className="font-semibold text-foreground">
                          {v.duty_teacher_name || (v.teacher ? `${v.teacher.name} ${v.teacher.surname}` : 'Öğretmen')}
                        </div>
                        {v.duty_location && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-[10px] font-medium">
                            📍 {v.duty_location}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-muted-foreground max-w-xs truncate">
                        {v.note || '-'}
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCancelTarget(v);
                            setCancelReason('');
                          }}
                          className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="İptal Et"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> İptal
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Sayfa <strong>{page}</strong> / <strong>{totalPages}</strong> (Toplam {total} kayıt)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="h-4 w-4" /> Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5"
              >
                Sonraki <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogHeader>
          <DialogTitle>İhlal Kaydını İptal Et</DialogTitle>
          <DialogDescription>
            {cancelTarget?.student?.ad_soyad} öğrencisine ait bu ihlal kaydını iptal etmek istediğinize emin misiniz?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">İptal Gerekçesi (İsteğe bağlı)</label>
            <Input
              type="text"
              placeholder="Örn: Yanlış numara girildi veya izinli öğrenci"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelTarget(null)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="destructive" className="font-bold">
              Kaydı İptal Et
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
