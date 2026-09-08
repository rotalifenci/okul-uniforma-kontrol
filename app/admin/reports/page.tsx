'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  FileText,
  Table,
  TrendingUp,
  GraduationCap,
  Layers,
  FileDown,
  Loader2,
  Search,
  Eye,
  ShieldAlert,
  ArrowRight,
  User,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDateTR, VIOLATION_TYPE_MAP, getCurrentIstanbulDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [classAnalytics, setClassAnalytics] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'records' | 'classes'>('students');

  // Quick Date Range helper
  const setQuickRange = (preset: 'all' | 'today' | 'yesterday' | 'week' | 'month') => {
    const todayStr = getCurrentIstanbulDate();
    const [y, m, d] = todayStr.split('-').map(Number);
    const formatLocal = (dt: Date) => {
      const yStr = dt.getFullYear();
      const mStr = String(dt.getMonth() + 1).padStart(2, '0');
      const dStr = String(dt.getDate()).padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    };

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yesterdayObj = new Date(y, m - 1, d - 1);
      const yDateStr = formatLocal(yesterdayObj);
      setStartDate(yDateStr);
      setEndDate(yDateStr);
    } else if (preset === 'week') {
      const todayDateObj = new Date(y, m - 1, d);
      const dayOfWeek = todayDateObj.getDay();
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayObj = new Date(y, m - 1, d - distanceToMonday);
      const sundayObj = new Date(y, m - 1, d - distanceToMonday + 6);
      setStartDate(formatLocal(mondayObj));
      setEndDate(formatLocal(sundayObj));
    } else if (preset === 'month') {
      const firstDayObj = new Date(y, m - 1, 1);
      const lastDayObj = new Date(y, m, 0);
      setStartDate(formatLocal(firstDayObj));
      setEndDate(formatLocal(lastDayObj));
    }
  };

  const fetchReports = async (showToast = false) => {
    setIsLoading(true);
    try {
      let url = `/api/reports?_t=${Date.now()}&`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (selectedClass) url += `sinif=${selectedClass}&`;
      if (selectedType) url += `type=${selectedType}&`;

      const [res1, res2] = await Promise.all([
        fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' } }),
        fetch(`/api/reports/analytics?_t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' } }),
      ]);

      const json1 = await res1.json();
      const json2 = await res2.json();

      if (json1.success) setReportData(json1.data);
      if (json2.success) setClassAnalytics(json2.data || []);
      if (showToast) toast.success('Rapor verileri güncellendi.');
    } catch {
      toast.error('Rapor verileri alınamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, startDate, endDate, selectedClass, selectedType]);

  // Real-time auto-refresh interval & tab focus listener
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReports();
    }, 10000);

    const onFocus = () => {
      fetchReports();
    };

    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [search, startDate, endDate, selectedClass, selectedType]);

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    let url = `/api/reports/export/${format}?`;
    if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    if (selectedClass) url += `sinif=${selectedClass}&`;
    if (selectedType) url += `type=${selectedType}&`;

    toast.info(`${format.toUpperCase()} raporu hazırlanıyor...`);
    window.open(url, '_blank');
  };

  const summary = reportData?.summary;
  const studentSummary: any[] = reportData?.studentSummary || [];
  const violationItems: any[] = reportData?.items || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Raporlama & Analiz
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Eş Zamanlı Canlı
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Tüm ihlal kayıtlarını ve ihlal alan öğrencileri inceleyin, filtreleyin ve PDF / Excel / CSV olarak indirin
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => fetchReports(true)}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="h-9 rounded-xl font-bold border-border hover:bg-muted"
            title="Verileri anında yenile"
          >
            <RotateCcw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            Yenile
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 rounded-xl shadow-sm"
          >
            <FileDown className="h-4 w-4 mr-1.5" /> PDF Rapor
          </Button>
          <Button
            onClick={() => handleExport('xlsx')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl shadow-sm"
          >
            <Download className="h-4 w-4 mr-1.5" /> Excel (XLSX)
          </Button>
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            className="h-9 rounded-xl font-bold"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> CSV İndir
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Toplam İhlal</span>
            <p className="text-2xl font-black text-foreground">{summary.total_violations}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">İhlalli Öğrenci</span>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{summary.unique_student_count || studentSummary.length}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1 border-rose-200 dark:border-rose-900 bg-rose-50/20">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">🔴 Tekrarlayan (2+)</span>
            <p className="text-2xl font-black text-rose-600">{summary.repeat_student_count}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Üst Forma Eksik</span>
            <p className="text-2xl font-black text-foreground">{summary.upper_missing}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1">
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Alt Forma Eksik</span>
            <p className="text-2xl font-black text-foreground">{summary.lower_missing}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Sivil / Uygunsuz</span>
            <p className="text-2xl font-black text-foreground">{summary.civil_clothes + (summary.inappropriate || 0)}</p>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Quick Date Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-border/60 text-xs">
            <span className="text-xs font-bold text-muted-foreground mr-1">Hızlı Filtre:</span>
            <Button
              type="button"
              size="sm"
              variant={!startDate && !endDate ? 'default' : 'outline'}
              onClick={() => setQuickRange('all')}
              className="h-7 text-xs px-2.5 rounded-lg"
            >
              Tüm Zamanlar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={startDate === getCurrentIstanbulDate() && endDate === getCurrentIstanbulDate() ? 'default' : 'outline'}
              onClick={() => setQuickRange('today')}
              className="h-7 text-xs px-2.5 rounded-lg"
            >
              Bugün
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setQuickRange('yesterday')}
              className="h-7 text-xs px-2.5 rounded-lg"
            >
              Dün
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setQuickRange('week')}
              className="h-7 text-xs px-2.5 rounded-lg"
            >
              Bu Hafta (Pzt-Paz)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setQuickRange('month')}
              className="h-7 text-xs px-2.5 rounded-lg"
            >
              Bu Ay
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Öğrenci No veya Ad Soyad ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl"
              />
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Tarih:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-xs w-36 rounded-xl"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 text-xs w-36 rounded-xl"
              />
            </div>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600 w-32"
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

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600 flex-1 min-w-[150px]"
            >
              <option value="">Tüm İhlal Türleri</option>
              <option value="UPPER_UNIFORM_MISSING">Üst Forma Eksik</option>
              <option value="LOWER_UNIFORM_MISSING">Alt Forma Eksik</option>
              <option value="CIVIL_CLOTHES">Tamamen Sivil / Uygunsuz</option>
              <option value="INAPPROPRIATE_CLOTHING">Kılık-Kıyafet Uygunsuz</option>
              <option value="OTHER">Diğer İhlal</option>
            </select>

            {(search || startDate || endDate || selectedClass || selectedType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                  setSelectedClass('');
                  setSelectedType('');
                }}
                className="text-xs h-10 px-3"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Sıfırla
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Students vs Detailed Records vs Class Breakdown */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-3 max-w-xl">
          <TabsTrigger value="students" className="font-bold">
            👤 İhlal Girilen Öğrenciler ({studentSummary.length})
          </TabsTrigger>
          <TabsTrigger value="records" className="font-bold">
            📋 Detaylı İhlal Listesi ({violationItems.length})
          </TabsTrigger>
          <TabsTrigger value="classes" className="font-bold">
            📊 Sınıf Analizi
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: All Students with Violations */}
        <TabsContent value="students">
          <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="p-3.5 pl-5">#</th>
                    <th className="p-3.5">Öğrenci No</th>
                    <th className="p-3.5">Adı Soyadı</th>
                    <th className="p-3.5">Sınıf/Şube</th>
                    <th className="p-3.5">Toplam İhlal Sayısı</th>
                    <th className="p-3.5">Son İhlal Türü</th>
                    <th className="p-3.5">Son İhlal Tarihi</th>
                    <th className="p-3.5 text-right pr-5">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Öğrenci ihlal kayıtları yükleniyor...
                      </td>
                    </tr>
                  ) : studentSummary.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Kriterlere uygun ihlal girilen öğrenci bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    studentSummary.map((item: any, idx: number) => {
                      const lastTypeInfo = VIOLATION_TYPE_MAP[item.last_violation?.type];
                      return (
                        <tr key={item.student.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5 pl-5 text-xs text-muted-foreground">{idx + 1}</td>
                          <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                            {item.student.ogrenci_no}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-xs overflow-hidden flex-shrink-0">
                                {item.student.profil_resmi_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.student.profil_resmi_url} alt={item.student.ad_soyad} className="w-full h-full object-cover" />
                                ) : (
                                  item.student.ad_soyad[0]
                                )}
                              </div>
                              <div>
                                <Link href={`/admin/students/${item.student.id}`} className="font-bold text-foreground hover:text-blue-600 block">
                                  {item.student.ad_soyad}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-semibold">
                            <span className="px-2 py-0.5 rounded-md bg-muted text-xs">
                              {item.student.sinif}-{item.student.sube}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-foreground">{item.violation_count}</span>
                              {item.is_repeat && (
                                <Badge variant="repeat" className="text-[10px] px-2 py-0.2">
                                  🔴 {item.violation_count} İhlal (Tekrar)
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <Badge className={lastTypeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}>
                              {lastTypeInfo?.shortLabel || item.last_violation?.type}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground font-medium">
                            {item.last_violation ? `${formatDateTR(item.last_violation.date)} ${item.last_violation.time}` : '-'}
                          </td>
                          <td className="p-3.5 text-right pr-5">
                            <Link href={`/admin/students/${item.student.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700">
                                <Eye className="h-3.5 w-3.5 mr-1" /> Profili Gör
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Records Table */}
        <TabsContent value="records">
          <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="p-3.5 pl-5">#</th>
                    <th className="p-3.5">Tarih / Saat</th>
                    <th className="p-3.5">Öğrenci No</th>
                    <th className="p-3.5">Adı Soyadı</th>
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
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Rapor verileri yükleniyor...
                      </td>
                    </tr>
                  ) : violationItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Seçilen filtre kriterlerine uygun kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    violationItems.map((item: any, idx: number) => {
                      const typeInfo = VIOLATION_TYPE_MAP[item.type];
                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5 pl-5 text-xs text-muted-foreground">{idx + 1}</td>
                          <td className="p-3.5 text-xs font-semibold">
                            <span className="font-bold block">{formatDateTR(item.date)}</span>
                            <span className="text-muted-foreground">{item.time}</span>
                          </td>
                          <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                            {item.student?.ogrenci_no}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">
                            {item.student ? (
                              <Link href={`/admin/students/${item.student.id}`} className="hover:text-blue-600">
                                {item.student.ad_soyad}
                              </Link>
                            ) : '-'}
                          </td>
                          <td className="p-3.5 font-semibold">
                            <span className="px-2 py-0.5 rounded-md bg-muted text-xs">
                              {item.student ? `${item.student.sinif}-${item.student.sube}` : '-'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <Badge className={typeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}>
                              {typeInfo?.label || item.type}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground">
                            <div className="font-medium text-foreground">
                              {item.duty_teacher_name || (item.teacher ? `${item.teacher.name} ${item.teacher.surname}` : '-')}
                            </div>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground max-w-xs truncate">
                            {item.note || '-'}
                          </td>
                          <td className="p-3.5 text-right pr-5">
                            {item.student && (
                              <Link href={`/admin/students/${item.student.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-blue-600">
                                  <Eye className="h-3.5 w-3.5 mr-1" /> Detay
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Class Analytics Breakdown */}
        <TabsContent value="classes">
          <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="p-3.5 pl-5">Sınıf/Şube</th>
                    <th className="p-3.5">Öğrenci Sayısı</th>
                    <th className="p-3.5">Toplam İhlal</th>
                    <th className="p-3.5">Öğrenci Başına İhlal</th>
                    <th className="p-3.5">Tekrarlayan Öğrenci</th>
                    <th className="p-3.5 pr-5">En Sık İhlal Türü</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {classAnalytics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Sınıf verisi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    classAnalytics.map((cls, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 pl-5 font-bold text-foreground">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold text-xs">
                            {cls.class_name}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground font-semibold">
                          {cls.student_count} Öğrenci
                        </td>
                        <td className="p-3.5 font-bold text-foreground">
                          {cls.total_violations}
                        </td>
                        <td className="p-3.5 text-xs font-semibold text-muted-foreground">
                          {cls.violations_per_student}
                        </td>
                        <td className="p-3.5">
                          {cls.repeat_offenders_count > 0 ? (
                            <Badge variant="repeat" className="text-xs px-2 py-0.5">
                              🔴 {cls.repeat_offenders_count} Öğrenci
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-3.5 pr-5 text-xs font-semibold text-foreground">
                          {cls.most_frequent_type}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

