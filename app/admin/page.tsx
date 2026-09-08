'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Users,
  GraduationCap,
  TrendingUp,
  UserCheck,
  Calendar,
  PlusCircle,
  UploadCloud,
  FileSpreadsheet,
  QrCode,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  ChevronRight,
  School
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/types';
import { formatDateTR, VIOLATION_TYPE_MAP } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { QrLoginModal } from '@/components/qr-modal';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  const loadStats = async (showToast = false) => {
    try {
      const res = await fetch(`/api/dashboard?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
        if (showToast) toast.success('Gösterge paneli güncellendi.');
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const interval = setInterval(() => {
      loadStats();
    }, 10000);

    const onFocus = () => {
      loadStats();
    };

    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Bugünkü İhlaller',
      value: stats?.today_total || 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      title: 'Bu Haftaki İhlaller',
      value: stats?.weekly_total || 0,
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      title: 'En Çok İhlal Olan Sınıf',
      value: stats?.top_violation_class || '-',
      icon: School,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    },
    {
      title: 'En Sık Görülen İhlal',
      value: stats?.top_violation_type || '-',
      icon: AlertTriangle,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    },
    {
      title: 'Tekrarlayan Öğrenci',
      value: stats?.repeat_offenders_count || 0,
      icon: ShieldAlert,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/40',
      badge: stats && stats.repeat_offenders_count > 0 ? 'Takip' : undefined,
    },
    {
      title: 'Nöbetçi Öğretmen',
      value: stats?.active_teachers_today || 0,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
  ];

  const typeDistributionData = stats?.type_distribution.filter((d) => d.count > 0) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Yönetici Genel Bakış
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Okul kılık-kıyafet kontrol istatistikleri ve anlık takip göstergeleri
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/teacher">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 rounded-xl shadow-sm">
              <PlusCircle className="h-4 w-4 mr-1.5" /> Hızlı İhlal Gir
            </Button>
          </Link>
          <Link href="/admin/imports">
            <Button size="sm" variant="outline" className="h-9 rounded-xl font-semibold">
              <UploadCloud className="h-4 w-4 mr-1.5" /> CSV / Excel Aktar
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button size="sm" variant="outline" className="h-9 rounded-xl font-semibold">
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Raporlar
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border border-border/80 shadow-sm bg-card hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {kpi.badge && (
                    <Badge variant="repeat" className="text-[10px] px-1.5 py-0">
                      {kpi.badge}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground truncate">{kpi.title}</p>
                  <p className="text-xl font-black text-foreground tracking-tight truncate mt-0.5">
                    {kpi.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Chart (Mon-Fri) */}
        <Card className="lg:col-span-2 rounded-2xl shadow-sm border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Haftalık Günlük İhlal Trendi</CardTitle>
                <CardDescription className="text-xs">Pazartesi - Cuma günleri arası kaydedilen toplam ihlaller</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">Bu Hafta</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.daily_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="day_name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`${value} ihlal`, 'Toplam']}
                    labelFormatter={(label) => `${label} Günü`}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution Pie Chart */}
        <Card className="rounded-2xl shadow-sm border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">İhlal Türü Dağılımı</CardTitle>
            <CardDescription className="text-xs">Haftalık ihlal türleri oranı</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 flex flex-col items-center justify-center">
            {typeDistributionData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistributionData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {typeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: any, name: any) => [`${value} ihlal`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                Henüz kayıtlı ihlal türü verisi yok.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Repeat Offenders & Recent Violations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repeat Offenders Table */}
        <Card className="rounded-2xl shadow-sm border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Özel Takip Gerektiren Öğrenciler</CardTitle>
                  <CardDescription className="text-xs">Bu hafta 2 veya daha fazla ihlal kaydı bulunan öğrenciler</CardDescription>
                </div>
              </div>
              <Link href="/admin/students" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                Tümünü Gör <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats?.repeat_offenders_list && stats.repeat_offenders_list.length > 0 ? (
              <div className="divide-y divide-border/60">
                {stats.repeat_offenders_list.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-sm overflow-hidden flex-shrink-0">
                        {item.student.profil_resmi_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.student.profil_resmi_url} alt={item.student.ad_soyad} className="w-full h-full object-cover" />
                        ) : (
                          item.student.ad_soyad[0]
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/students/${item.student.id}`} className="font-bold text-sm text-foreground hover:text-blue-600 transition-colors block">
                          {item.student.ad_soyad}
                        </Link>
                        <p className="text-xs text-muted-foreground font-medium">
                          No: <strong>{item.student.ogrenci_no}</strong> • {item.student.sinif}-{item.student.sube}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="repeat" className="font-extrabold text-xs px-2.5 py-1">
                        🔴 Bu hafta {item.weekly_count} İhlal
                      </Badge>
                      <Link href={`/admin/students/${item.student.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Bu hafta tekrarlayan kılık-kıyafet ihlali yapan öğrenci bulunmuyor.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Violations Stream */}
        <Card className="rounded-2xl shadow-sm border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Son İhlal Kayıtları</CardTitle>
                  <CardDescription className="text-xs">Sisteme girilen en son 10 denetim kaydı</CardDescription>
                </div>
              </div>
              <Link href="/admin/violations" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                Tüm Kayıtlar <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats?.recent_violations && stats.recent_violations.length > 0 ? (
              <div className="divide-y divide-border/60 max-h-[380px] overflow-y-auto">
                {stats.recent_violations.map((v) => {
                  const typeInfo = VIOLATION_TYPE_MAP[v.type];
                  return (
                    <div key={v.id} className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-center bg-muted/70 p-2 rounded-xl min-w-[52px]">
                          <span className="text-[11px] font-bold text-foreground block">{v.time}</span>
                          <span className="text-[10px] text-muted-foreground block">{formatDateTR(v.date).slice(0, 5)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground">
                            {v.student?.ad_soyad} ({v.student?.sinif}-{v.student?.sube})
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Nöbetçi: <strong>{v.teacher ? `${v.teacher.name} ${v.teacher.surname}` : 'Öğretmen'}</strong>
                          </p>
                        </div>
                      </div>

                      <Badge className={`text-[10px] px-2 py-0.5 ${typeInfo?.badgeColor || 'bg-slate-100 text-slate-800'}`}>
                        {typeInfo?.shortLabel || v.type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Henüz ihlal kaydı bulunmuyor.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <QrLoginModal open={showQrModal} onOpenChange={setShowQrModal} />
    </div>
  );
}
