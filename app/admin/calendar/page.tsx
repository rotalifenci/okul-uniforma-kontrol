'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Calendar,
  Clock,
  Filter,
  User,
  GraduationCap,
  Shirt,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Eye,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Violation } from '@/types';
import { formatDateTR, VIOLATION_TYPE_MAP, getCurrentIstanbulDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminCalendarPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [weekOffset, setWeekOffset] = useState(0); // 0: this week, -1: last week, +1: next week
  const [selectedDay, setSelectedDay] = useState<string>('all'); // 'all' or '0'..'6'
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Calculate Monday of the target week based on weekOffset
  const todayStr = getCurrentIstanbulDate();
  const [curY, curM, curD] = todayStr.split('-').map(Number);
  const curDateObj = new Date(curY, curM - 1, curD);
  const curDayOfWeek = curDateObj.getDay();
  const curDistanceToMonday = curDayOfWeek === 0 ? 6 : curDayOfWeek - 1;

  // Base Monday date for the offset
  const targetMondayObj = new Date(curY, curM - 1, curD - curDistanceToMonday + (weekOffset * 7));

  const formatLocal = (dt: Date) => {
    const yStr = dt.getFullYear();
    const mStr = String(dt.getMonth() + 1).padStart(2, '0');
    const dStr = String(dt.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  };

  const weekStartDate = formatLocal(targetMondayObj);
  const targetSundayObj = new Date(targetMondayObj.getFullYear(), targetMondayObj.getMonth(), targetMondayObj.getDate() + 6);
  const weekEndDate = formatLocal(targetSundayObj);

  const dayNamesTR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const weekDays = dayNamesTR.map((dayName, idx) => {
    const d = new Date(targetMondayObj.getFullYear(), targetMondayObj.getMonth(), targetMondayObj.getDate() + idx);
    const dateStr = formatLocal(d);
    return {
      dayIndex: String(idx),
      name: dayName,
      date: dateStr,
      formattedDate: formatDateTR(dateStr),
    };
  });

  const fetchCalendar = async (start: string, end: string, showToast = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar?startDate=${start}&endDate=${end}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setViolations(json.data.violations || []);
        if (showToast) toast.success('Takvim verileri güncellendi.');
      }
    } catch {
      toast.error('Takvim verileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(weekStartDate, weekEndDate);
  }, [weekStartDate, weekEndDate]);

  // Real-time auto-refresh interval & focus listener
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCalendar(weekStartDate, weekEndDate);
    }, 10000);

    const onFocus = () => {
      fetchCalendar(weekStartDate, weekEndDate);
    };

    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [weekStartDate, weekEndDate]);

  const currentSelectedDayObj = selectedDay === 'all' 
    ? null 
    : weekDays[Number(selectedDay)] || weekDays[0];

  // Filter violations
  const filteredViolations = violations.filter((v) => {
    if (selectedDay !== 'all' && currentSelectedDayObj && v.date !== currentSelectedDayObj.date) {
      return false;
    }
    if (classFilter && v.student?.sinif !== classFilter) return false;
    if (typeFilter && v.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Haftalık Denetim Takvimi
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Eş Zamanlı Canlı
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Haftanın günlerine göre kılık-kıyafet kontrol kayıtlarını inceleyin ve geriye/ileriye dönük takip yapın
          </p>
        </div>

        {/* Action & Week Navigation Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => fetchCalendar(weekStartDate, weekEndDate, true)}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="h-8 rounded-xl font-bold border-border hover:bg-muted text-xs"
            title="Verileri anında yenile"
          >
            <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            Yenile
          </Button>

          <div className="flex items-center bg-muted p-1 rounded-xl">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset((o) => o - 1)}
              className="h-8 px-2 text-xs font-bold"
              title="Önceki Hafta"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Önceki Hafta
            </Button>
            <Button
              type="button"
              variant={weekOffset === 0 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setWeekOffset(0)}
              className="h-8 px-2.5 text-xs font-bold"
            >
              Bu Hafta
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset((o) => o + 1)}
              className="h-8 px-2 text-xs font-bold"
              title="Sonraki Hafta"
            >
              Sonraki Hafta <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar & Week Info */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground">Aktif Takvim Aralığı:</span>
              <p className="text-sm font-extrabold text-foreground">
                {formatDateTR(weekStartDate)} — {formatDateTR(weekEndDate)}
                {weekOffset === 0 && <span className="ml-2 text-xs text-blue-600 font-bold">(Şu Anki Hafta)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Tüm Sınıflar</option>
              <option value="5">5. Sınıf</option>
              <option value="6">6. Sınıf</option>
              <option value="7">7. Sınıf</option>
              <option value="8">8. Sınıf</option>
              <option value="9">9. Sınıf</option>
              <option value="10">10. Sınıf</option>
              <option value="11">11. Sınıf</option>
              <option value="12">12. Sınıf</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Tüm İhlaller</option>
              <option value="UPPER_UNIFORM_MISSING">Üst Forma</option>
              <option value="LOWER_UNIFORM_MISSING">Alt Forma</option>
              <option value="PHYSICAL_EDUCATION_UNIFORM">Beden Eğitimi</option>
              <option value="CIVIL_CLOTHES">Sivil</option>
              <option value="INAPPROPRIATE_CLOTHING">Uygunsuzluk</option>
              <option value="OTHER">Diğer</option>
            </select>

            {(classFilter || typeFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClassFilter('');
                  setTypeFilter('');
                }}
                className="h-9 text-xs px-2"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Sıfırla
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Week Days Tabs */}
      <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 h-auto p-1.5 rounded-2xl bg-muted/80 gap-1">
          {/* All Week Tab */}
          <TabsTrigger
            value="all"
            className="flex flex-col items-center justify-center py-2 rounded-xl gap-0.5"
          >
            <span className="text-xs font-black">Tüm Hafta</span>
            <span className="text-[10px] text-muted-foreground">Pzt-Paz</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold mt-0.5 ${violations.length > 0 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              {violations.length}
            </span>
          </TabsTrigger>

          {/* 7 Days (Pzt - Paz) */}
          {weekDays.map((wd) => {
            const count = violations.filter((v) => v.date === wd.date).length;
            const isToday = wd.date === todayStr;
            return (
              <TabsTrigger
                key={wd.dayIndex}
                value={wd.dayIndex}
                className={`flex flex-col items-center justify-center py-2 rounded-xl gap-0.5 ${isToday ? 'ring-1 ring-blue-500' : ''}`}
              >
                <span className="text-xs font-bold flex items-center gap-1">
                  {wd.name.slice(0, 3)}
                  {isToday && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" title="Bugün" />}
                </span>
                <span className="text-[10px] text-muted-foreground">{wd.formattedDate.slice(0, 5)}</span>
                <span className={`text-[10px] px-1.5 rounded-full font-bold mt-0.5 ${count > 0 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4">
          <div className="flex items-center justify-between px-2 pb-3">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              {selectedDay === 'all'
                ? `Haftanın Tüm Kayıtları (${formatDateTR(weekStartDate)} - ${formatDateTR(weekEndDate)})`
                : `${currentSelectedDayObj?.name} (${currentSelectedDayObj?.formattedDate})`}
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {filteredViolations.length} Kayıt Bulundu
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Takvim kayıtları yükleniyor...
            </div>
          ) : filteredViolations.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground rounded-2xl border-dashed">
              <p className="text-sm font-semibold">
                {selectedDay === 'all' 
                  ? 'Bu hafta için herhangi bir ihlal kaydı bulunmuyor.' 
                  : 'Seçilen gün için kayıtlı ihlal bulunmuyor.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDay('all')}
                  className="text-xs font-bold"
                >
                  Tüm Haftayı Görüntüle
                </Button>
                <Link href="/teacher">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                    Yeni İhlal Gir
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredViolations.map((v) => {
                const typeInfo = VIOLATION_TYPE_MAP[v.type];
                return (
                  <Card key={v.id} className="rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow bg-card overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-sm overflow-hidden flex-shrink-0">
                            {v.student?.profil_resmi_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.student.profil_resmi_url} alt={v.student.ad_soyad} className="w-full h-full object-cover" />
                            ) : (
                              v.student?.ad_soyad[0] || 'Ö'
                            )}
                          </div>
                          <div>
                            <Link href={`/admin/students/${v.student?.id}`} className="font-bold text-sm text-foreground hover:text-blue-600 block">
                              {v.student?.ad_soyad}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              No: <strong>{v.student?.ogrenci_no}</strong> • <span className="font-bold text-foreground">{v.student?.sinif}-{v.student?.sube}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-foreground block">{formatDateTR(v.date).slice(0, 5)}</span>
                          <span className="text-[11px] text-muted-foreground block">{v.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Badge className={typeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}>
                          {typeInfo?.label || v.type}
                        </Badge>

                        {v.student && (
                          <Link href={`/admin/students/${v.student.id}`} className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" /> Detay
                          </Link>
                        )}
                      </div>

                      {v.note && (
                        <div className="bg-muted/50 p-2 rounded-xl text-xs text-muted-foreground flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                          <span>{v.note}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>Nöbetçi: <strong>{v.duty_teacher_name || (v.teacher ? `${v.teacher.name} ${v.teacher.surname}` : 'Öğretmen')}</strong></span>
                        {v.duty_location && <span className="text-[10px]">📍 {v.duty_location}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

