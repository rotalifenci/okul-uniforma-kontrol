'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
  Code
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AuditLog } from '@/types';
import { formatDateTR } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Inspector Dialog
  const [inspectTarget, setInspectTarget] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let url = `/api/audit-logs?page=${page}&limit=${limit}`;
      if (actionFilter) url += `&action=${actionFilter}`;
      if (entityFilter) url += `&entityType=${entityFilter}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.items);
        setTotal(json.data.total);
        setTotalPages(json.data.totalPages);
      }
    } catch {
      toast.error('Audit logları yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, actionFilter, entityFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('IMPORTED')) {
      return <Badge variant="success" className="text-[10px]">{action}</Badge>;
    }
    if (action.includes('CANCELLED') || action.includes('DEACTIVATED') || action.includes('DELETED')) {
      return <Badge variant="destructive" className="text-[10px]">{action}</Badge>;
    }
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return <Badge variant="info" className="text-[10px]">{action}</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px]">{action}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Sistem Denetim Günlüğü (Audit Log)
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Kullanıcı işlemleri, ihlal kayıtları, öğrenci güncellemeleri ve güvenlik olayları
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchLogs} className="h-9 rounded-xl font-semibold">
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600 flex-1"
            >
              <option value="">Tüm Varlık Türleri</option>
              <option value="VIOLATION">İhlaller (VIOLATION)</option>
              <option value="STUDENT">Öğrenciler (STUDENT)</option>
              <option value="USER">Kullanıcılar (USER)</option>
              <option value="IMPORT">İçe Aktarma (IMPORT)</option>
              <option value="SETTING">Ayarlar & Kapanış (SETTING)</option>
              <option value="AUTH">Giriş / Oturum (AUTH)</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-blue-600 flex-1"
            >
              <option value="">Tüm İşlemler</option>
              <option value="VIOLATION_CREATED">İhlal Oluşturuldu</option>
              <option value="VIOLATION_CANCELLED">İhlal İptal Edildi</option>
              <option value="STUDENT_CREATED">Öğrenci Eklendi</option>
              <option value="STUDENTS_IMPORTED">Toplu Import Yapıldı</option>
              <option value="USER_LOGIN">Kullanıcı Girişi</option>
              <option value="DAY_CLOSED">Gün Sonu Kapanışı</option>
            </select>

            {(entityFilter || actionFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEntityFilter('');
                  setActionFilter('');
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

      {/* Logs Table Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">
            Toplam {total} Denetim Kaydı
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
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-bold border-b border-border">
              <tr>
                <th className="p-3 pl-4">Zaman</th>
                <th className="p-3">Kullanıcı</th>
                <th className="p-3">İşlem (Action)</th>
                <th className="p-3">Varlık (Entity)</th>
                <th className="p-3">IP Adresi</th>
                <th className="p-3 pr-4 text-right">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loglar yükleniyor...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Denetim kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-4 font-mono text-muted-foreground">
                      {formatDateTR(log.created_at)} {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3 font-semibold text-foreground">
                      {log.user ? `${log.user.name} ${log.user.surname} (@${log.user.username})` : 'Sistem'}
                    </td>
                    <td className="p-3">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="p-3 font-semibold text-muted-foreground">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(-6)})` : ''}
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {log.ip_address || '-'}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      {(log.old_value || log.new_value) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectTarget(log)}
                          className="h-7 px-2 text-xs"
                          title="Detayları İncele"
                        >
                          <Code className="h-3.5 w-3.5 mr-1" /> İncele
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
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

      {/* Inspector Dialog */}
      <Dialog open={!!inspectTarget} onOpenChange={(open) => !open && setInspectTarget(null)}>
        <DialogHeader>
          <DialogTitle>Audit Log Detay Görüntüleyici</DialogTitle>
          <DialogDescription>
            {inspectTarget?.action} - {inspectTarget?.entity_type} ({formatDateTR(inspectTarget?.created_at)})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto font-mono text-xs">
          {inspectTarget?.old_value && (
            <div>
              <p className="font-bold text-rose-600 mb-1">Eski Değer (Old Value):</p>
              <pre className="p-3 rounded-xl bg-muted overflow-x-auto text-[11px]">
                {JSON.stringify(JSON.parse(inspectTarget.old_value), null, 2)}
              </pre>
            </div>
          )}

          {inspectTarget?.new_value && (
            <div>
              <p className="font-bold text-emerald-600 mb-1">Yeni Değer (New Value):</p>
              <pre className="p-3 rounded-xl bg-muted overflow-x-auto text-[11px]">
                {JSON.stringify(JSON.parse(inspectTarget.new_value), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
