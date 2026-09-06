'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDateTR, VIOLATION_TYPE_MAP } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [classAnalytics, setClassAnalytics] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'classes'>('records');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let url = `/api/reports?`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (selectedClass) url += `sinif=${selectedClass}&`;
      if (selectedType) url += `type=${selectedType}&`;

      const [res1, res2] = await Promise.all([
        fetch(url),
        fetch('/api/reports/analytics'),
      ]);

      const json1 = await res1.json();
      const json2 = await res2.json();

      if (json1.success) setReportData(json1.data);
      if (json2.success) setClassAnalytics(json2.data || []);
    } catch {
      toast.error('Rapor verileri alınamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedClass, selectedType]);

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    let url = `/api/reports/export/${format}?`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    if (selectedClass) url += `sinif=${selectedClass}&`;
    if (selectedType) url += `type=${selectedType}&`;

    toast.info(`${format.toUpperCase()} raporu hazırlanıyor...`);
    window.open(url, '_blank');
  };

  const summary = reportData?.summary;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Raporlama & Analiz
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Kılık-kıyafet denetim raporlarını filtreleyin, analiz edin ve PDF / Excel / CSV olarak indirin
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
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
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Üst Forma Eksik</span>
            <p className="text-2xl font-black text-foreground">{summary.upper_missing}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1">
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Alt Forma Eksik</span>
            <p className="text-2xl font-black text-foreground">{summary.lower_missing}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Sivil / Uygunsuz</span>
            <p className="text-2xl font-black text-foreground">{summary.civil_clothes}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Diğer İhlaller</span>
            <p className="text-2xl font-black text-foreground">{summary.other + (summary.inappropriate || 0)}</p>
          </Card>
          <Card className="rounded-2xl border-border bg-card p-4 space-y-1 border-rose-200 dark:border-rose-900 bg-rose-50/20">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">🔴 Tekrarlayan Öğrenci</span>
            <p className="text-2xl font-black text-rose-600">{summary.repeat_student_count}</p>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Tarih Aralığı:</span>
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

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
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

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600 flex-1"
            >
              <option value="">Tüm İhlal Türleri</option>
              <option value="UPPER_UNIFORM_MISSING">Üst Forma Eksik</option>
              <option value="LOWER_UNIFORM_MISSING">Alt Forma Eksik</option>
              <option value="CIVIL_CLOTHES">Tamamen Sivil / Uygunsuz</option>
              <option value="INAPPROPRIATE_CLOTHING">Kılık-Kıyafet Uygunsuz</option>
              <option value="OTHER">Diğer İhlal</option>
            </select>

            {(startDate || endDate || selectedClass || selectedType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedClass('');
                  setSelectedType('');
                }}
                className="text-xs h-10"
              >
                Filtreleri Sıfırla
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Detailed Records vs Class Breakdown */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="records">Detaylı İhlal Listesi</TabsTrigger>
          <TabsTrigger value="classes">Sınıf Bazlı Analiz</TabsTrigger>
        </TabsList>

        {/* Tab 1: Records Table */}
        <TabsContent value="records">
          <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="p-3.5 pl-5">#</th>
                    <th className="p-3.5">Tarih</th>
                    <th className="p-3.5">Öğrenci No</th>
                    <th className="p-3.5">Adı Soyadı</th>
                    <th className="p-3.5">Sınıf/Şube</th>
                    <th className="p-3.5">İhlal Türü</th>
                    <th className="p-3.5">Nöbetçi Öğretmen</th>
                    <th className="p-3.5 pr-5">Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Rapor verileri yükleniyor...
                      </td>
                    </tr>
                  ) : !reportData?.items || reportData.items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Seçilen filtre kriterlerine uygun kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    reportData.items.map((item: any, idx: number) => {
                      const typeInfo = VIOLATION_TYPE_MAP[item.type];
                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5 pl-5 text-xs text-muted-foreground">{idx + 1}</td>
                          <td className="p-3.5 text-xs font-semibold">
                            {formatDateTR(item.date)} <span className="text-muted-foreground">{item.time}</span>
                          </td>
                          <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                            {item.student?.ogrenci_no}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">
                            {item.student?.ad_soyad}
                          </td>
                          <td className="p-3.5 font-semibold">
                            <span className="px-2 py-0.5 rounded-md bg-muted text-xs">
                              {item.student?.sinif}-{item.student?.sube}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <Badge className={typeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}>
                              {typeInfo?.label || item.type}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground">
                            {item.teacher ? `${item.teacher.name} ${item.teacher.surname}` : '-'}
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground pr-5 max-w-xs truncate">
                            {item.note || '-'}
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

        {/* Tab 2: Class Analytics Breakdown */}
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
