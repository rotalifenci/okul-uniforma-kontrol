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
  FileText
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('0'); // 0: Mon, 1: Tue ...
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Calculate current week days
  const today = getCurrentIstanbulDate();
  const todayDateObj = new Date(today);
  const dayOfWeek = todayDateObj.getDay();
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayObj = new Date(todayDateObj);
  mondayObj.setDate(todayDateObj.getDate() - distanceToMonday);

  const weekDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].map((dayName, idx) => {
    const d = new Date(mondayObj);
    d.setDate(mondayObj.getDate() + idx);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dayIndex: String(idx),
      name: dayName,
      date: dateStr,
      formattedDate: formatDateTR(dateStr),
    };
  });

  const fetchCalendar = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/calendar');
      const json = await res.json();
      if (json.success && json.data) {
        setViolations(json.data.violations || []);
        setStartDate(json.data.startDate);
        setEndDate(json.data.endDate);
      }
    } catch {
      toast.error('Takvim verileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    // Default select today's day index if weekday (0-4)
    const currentWeekdayIdx = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek - 1 : 0;
    setSelectedDay(String(currentWeekdayIdx));
  }, []);

  const currentSelectedDayObj = weekDays[Number(selectedDay)] || weekDays[0];

  // Filter violations for this day
  const filteredViolations = violations.filter((v) => {
    if (v.date !== currentSelectedDayObj.date) return false;
    if (classFilter && v.student?.sinif !== classFilter) return false;
    if (typeFilter && v.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Haftalık Denetim Takvimi
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Haftanın günlerine göre kılık-kıyafet kontrol kayıtlarını inceleyin
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600"
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
            className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Tüm İhlaller</option>
            <option value="UPPER_UNIFORM_MISSING">Üst Forma</option>
            <option value="LOWER_UNIFORM_MISSING">Alt Forma</option>
            <option value="CIVIL_CLOTHES">Sivil</option>
            <option value="OTHER">Diğer</option>
          </select>
        </div>
      </div>

      {/* Week Tabs */}
      <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
        <TabsList className="grid grid-cols-5 h-16 p-1.5 rounded-2xl bg-muted/80">
          {weekDays.map((wd) => {
            const count = violations.filter((v) => v.date === wd.date).length;
            const isToday = wd.date === today;
            return (
              <TabsTrigger
                key={wd.dayIndex}
                value={wd.dayIndex}
                className="flex flex-col items-center justify-center py-1.5 rounded-xl gap-0.5"
              >
                <span className="text-xs font-bold">{wd.name}</span>
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
              {currentSelectedDayObj.name} ({currentSelectedDayObj.formattedDate})
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
              <p className="text-sm font-semibold">Bu gün için herhangi bir ihlal kaydı bulunmuyor.</p>
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
                              v.student?.ad_soyad[0]
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
                          <span className="text-xs font-black text-foreground block">{v.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Badge className={typeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}>
                          {typeInfo?.label || v.type}
                        </Badge>
                      </div>

                      {v.note && (
                        <div className="bg-muted/50 p-2 rounded-xl text-xs text-muted-foreground flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                          <span>{v.note}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>Nöbetçi: <strong>{v.teacher ? `${v.teacher.name} ${v.teacher.surname}` : 'Öğretmen'}</strong></span>
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
