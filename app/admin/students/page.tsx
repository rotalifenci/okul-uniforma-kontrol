'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  UserPlus,
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Student } from '@/types';
import { toast } from 'sonner';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'passive'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    ogrenci_no: '',
    ad_soyad: '',
    sinif: '9',
    sube: 'A',
    cinsiyet: 'ERKEK',
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let url = `/api/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      if (selectedClass) url += `&sinif=${encodeURIComponent(selectedClass)}`;
      if (activeFilter === 'active') url += `&aktif=true`;
      if (activeFilter === 'passive') url += `&aktif=false`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setStudents(json.data.items);
        setTotal(json.data.total);
        setTotalPages(json.data.totalPages);
      }
    } catch {
      toast.error('Öğrenciler yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, limit, selectedClass, activeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Öğrenci başarıyla eklendi.');
        setShowAddDialog(false);
        setFormData({ ogrenci_no: '', ad_soyad: '', sinif: '9', sube: 'A', cinsiyet: 'ERKEK' });
        fetchStudents();
      } else {
        toast.error(json.message || 'Öğrenci eklenemedi.');
      }
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Öğrenci güncellendi.');
        setShowEditDialog(false);
        setEditingStudent(null);
        fetchStudents();
      } else {
        toast.error(json.message || 'Güncelleme başarısız.');
      }
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const handleToggleActive = async (student: Student) => {
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Öğrenci durumu değiştirildi.');
        fetchStudents();
      } else {
        toast.error(json.message || 'İşlem yapılamadı.');
      }
    } catch {
      toast.error('Sunucu hatası.');
    }
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      ogrenci_no: s.ogrenci_no,
      ad_soyad: s.ad_soyad,
      sinif: s.sinif,
      sube: s.sube,
      cinsiyet: s.cinsiyet || 'ERKEK',
    });
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Öğrenci Yönetimi
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Kayıtlı tüm öğrencileri görüntüleyin, yeni öğrenci ekleyin veya düzenleyin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setFormData({ ogrenci_no: '', ad_soyad: '', sinif: '9', sube: 'A', cinsiyet: 'ERKEK' });
              setShowAddDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 shadow-sm"
          >
            <UserPlus className="h-4 w-4 mr-1.5" /> + Yeni Öğrenci Ekle
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Öğrenci No veya Ad Soyad ile filtrele..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
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

            {/* Status Filter */}
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Yalnızca Aktifler</option>
              <option value="passive">Pasif Öğrenciler</option>
            </select>

            <Button variant="ghost" size="icon" onClick={() => fetchStudents()} className="h-10 w-10 rounded-xl">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Data View */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">
            Öğrenci Listesi ({total} Kayıt)
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Sayfa Başına:</span>
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
              <option value={100}>100</option>
            </select>
          </div>
        </CardHeader>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase border-b border-border">
              <tr>
                <th className="p-3.5 pl-5">Öğrenci</th>
                <th className="p-3.5">Okul No</th>
                <th className="p-3.5">Sınıf/Şube</th>
                <th className="p-3.5">Cinsiyet</th>
                <th className="p-3.5">Toplam İhlal</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-right pr-5">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Öğrenciler yükleniyor...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Filtreye uygun öğrenci bulunamadı.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-xs overflow-hidden flex-shrink-0">
                          {s.profil_resmi_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.profil_resmi_url} alt={s.ad_soyad} className="w-full h-full object-cover" />
                          ) : (
                            s.ad_soyad[0]
                          )}
                        </div>
                        <div>
                          <Link href={`/admin/students/${s.id}`} className="font-bold text-foreground hover:text-blue-600 block">
                            {s.ad_soyad}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                      {s.ogrenci_no}
                    </td>
                    <td className="p-3.5 font-semibold text-foreground">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-xs">
                        {s.sinif}-{s.sube}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">
                      {s.cinsiyet || '-'}
                    </td>
                    <td className="p-3.5">
                      {(s.violations_count || 0) > 0 ? (
                        <Badge variant="repeat" className="text-xs px-2 py-0.5">
                          {s.violations_count} İhlal
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {s.aktif ? (
                        <Badge variant="success" className="text-[11px]">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[11px]">Pasif</Badge>
                      )}
                    </td>
                    <td className="p-3.5 text-right pr-5 space-x-1">
                      <Link href={`/admin/students/${s.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Geçmişi İncele">
                          <Eye className="h-3.5 w-3.5 mr-1" /> Detay
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 px-2 text-xs" title="Düzenle">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(s)}
                        className={`h-8 px-2 text-xs ${s.aktif ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                        title={s.aktif ? 'Pasife Al' : 'Aktifleştir'}
                      >
                        {s.aktif ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-border/60">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Öğrenciler yükleniyor...</div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Öğrenci bulunamadı.</div>
          ) : (
            students.map((s) => (
              <div key={s.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-sm overflow-hidden flex-shrink-0">
                      {s.profil_resmi_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.profil_resmi_url} alt={s.ad_soyad} className="w-full h-full object-cover" />
                      ) : (
                        s.ad_soyad[0]
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/students/${s.id}`} className="font-bold text-sm text-foreground hover:text-blue-600">
                        {s.ad_soyad}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        No: <strong className="text-blue-600 dark:text-blue-400">{s.ogrenci_no}</strong> • {s.sinif}-{s.sube}
                      </p>
                    </div>
                  </div>

                  <Badge variant={s.aktif ? 'success' : 'secondary'} className="text-[10px]">
                    {s.aktif ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-muted-foreground">
                    Toplam İhlal: <strong>{s.violations_count || 0}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/students/${s.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                        İncele
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="h-7 px-2">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Sayfa <strong>{page}</strong> / <strong>{totalPages}</strong> (Toplam {total} öğrenci)
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

      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogHeader>
          <DialogTitle>Yeni Öğrenci Ekle</DialogTitle>
          <DialogDescription>
            Sisteme yeni bir öğrenci kaydı oluşturun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Öğrenci Numarası *</label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Örn: 105"
              value={formData.ogrenci_no}
              onChange={(e) => setFormData({ ...formData, ogrenci_no: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Ad Soyad *</label>
            <Input
              type="text"
              placeholder="Örn: Ahmet Yılmaz"
              value={formData.ad_soyad}
              onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Sınıf *</label>
              <select
                value={formData.sinif}
                onChange={(e) => setFormData({ ...formData, sinif: e.target.value })}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-blue-600"
              >
                <option value="5">5. Sınıf</option>
                <option value="6">6. Sınıf</option>
                <option value="7">7. Sınıf</option>
                <option value="8">8. Sınıf</option>
                <option value="9">9. Sınıf</option>
                <option value="10">10. Sınıf</option>
                <option value="11">11. Sınıf</option>
                <option value="12">12. Sınıf</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Şube *</label>
              <select
                value={formData.sube}
                onChange={(e) => setFormData({ ...formData, sube: e.target.value })}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-blue-600"
              >
                {['A', 'B', 'C', 'D', 'E', 'F'].map((b) => (
                  <option key={b} value={b}>{b} Şubesi</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Cinsiyet</label>
            <select
              value={formData.cinsiyet}
              onChange={(e) => setFormData({ ...formData, cinsiyet: e.target.value })}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-blue-600"
            >
              <option value="ERKEK">Erkek</option>
              <option value="KIZ">Kız</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
              İptal
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogHeader>
          <DialogTitle>Öğrenci Bilgilerini Düzenle</DialogTitle>
          <DialogDescription>
            {editingStudent?.ad_soyad} öğrencisinin bilgilerini güncelleyin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Öğrenci Numarası *</label>
            <Input
              type="text"
              value={formData.ogrenci_no}
              onChange={(e) => setFormData({ ...formData, ogrenci_no: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Ad Soyad *</label>
            <Input
              type="text"
              value={formData.ad_soyad}
              onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Sınıf *</label>
              <select
                value={formData.sinif}
                onChange={(e) => setFormData({ ...formData, sinif: e.target.value })}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-blue-600"
              >
                <option value="5">5. Sınıf</option>
                <option value="6">6. Sınıf</option>
                <option value="7">7. Sınıf</option>
                <option value="8">8. Sınıf</option>
                <option value="9">9. Sınıf</option>
                <option value="10">10. Sınıf</option>
                <option value="11">11. Sınıf</option>
                <option value="12">12. Sınıf</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Şube *</label>
              <select
                value={formData.sube}
                onChange={(e) => setFormData({ ...formData, sube: e.target.value })}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-blue-600"
              >
                {['A', 'B', 'C', 'D', 'E', 'F'].map((b) => (
                  <option key={b} value={b}>{b} Şubesi</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
              Vazgeç
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              Güncelle
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
