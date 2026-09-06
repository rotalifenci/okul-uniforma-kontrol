'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Key,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { User } from '@/types';
import { formatDateTR } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    surname: '',
    password: '',
    role: 'TEACHER',
  });

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teachers');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTeachers(json.data);
      }
    } catch {
      toast.error('Öğretmenler yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Öğretmen hesabı oluşturuldu.');
        setShowAddDialog(false);
        setFormData({ username: '', name: '', surname: '', password: '', role: 'TEACHER' });
        fetchTeachers();
      } else {
        toast.error(json.message || 'Öğretmen eklenemedi.');
      }
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      const res = await fetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTeacher.id,
          name: formData.name,
          surname: formData.surname,
          password: formData.password || undefined,
          role: formData.role,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Kullanıcı güncellendi.');
        setShowEditDialog(false);
        setEditingTeacher(null);
        fetchTeachers();
      } else {
        toast.error(json.message || 'Güncelleme başarısız.');
      }
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const handleToggleActive = async (teacher: any) => {
    try {
      const res = await fetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: teacher.id,
          active: !teacher.active,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Kullanıcı durumu güncellendi.');
        fetchTeachers();
      } else {
        toast.error(json.message || 'İşlem başarısız.');
      }
    } catch {
      toast.error('Sunucu hatası.');
    }
  };

  const openEdit = (t: any) => {
    setEditingTeacher(t);
    setFormData({
      username: t.username,
      name: t.name,
      surname: t.surname,
      password: '',
      role: t.role,
    });
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Öğretmen & Kullanıcı Yönetimi
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Nöbetçi öğretmen ve yönetici hesaplarını yönetin, şifre sıfırlayın veya yetki atayın
          </p>
        </div>

        <Button
          onClick={() => {
            setFormData({ username: '', name: '', surname: '', password: '', role: 'TEACHER' });
            setShowAddDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 shadow-sm"
        >
          <UserPlus className="h-4 w-4 mr-1.5" /> + Yeni Öğretmen Ekle
        </Button>
      </div>

      {/* Teachers Table Card */}
      <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">
            Kullanıcı Listesi ({teachers.length})
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchTeachers} className="h-8 w-8">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase border-b border-border">
              <tr>
                <th className="p-3.5 pl-5">Ad Soyad</th>
                <th className="p-3.5">Kullanıcı Adı</th>
                <th className="p-3.5">Rol</th>
                <th className="p-3.5">Toplam Kayıt</th>
                <th className="p-3.5">Son Giriş</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-right pr-5">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Kullanıcılar yükleniyor...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-foreground">
                      {t.name} {t.surname}
                    </td>
                    <td className="p-3.5 font-semibold text-blue-600 dark:text-blue-400">
                      @{t.username}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={t.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                        {t.role === 'ADMIN' ? 'Yönetici' : 'Nöbetçi Öğretmen'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground font-semibold">
                      {t._count?.violations || 0} İhlal Kaydı
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">
                      {t.last_login_at ? formatDateTR(t.last_login_at) : 'Giriş Yok'}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={t.active ? 'success' : 'secondary'} className="text-[11px]">
                        {t.active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right pr-5 space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="h-8 px-2 text-xs" title="Düzenle / Şifre Değiştir">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(t)}
                        className={`h-8 px-2 text-xs ${t.active ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                        title={t.active ? 'Pasife Al' : 'Aktifleştir'}
                      >
                        {t.active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Teacher Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogHeader>
          <DialogTitle>Yeni Öğretmen / Kullanıcı Ekle</DialogTitle>
          <DialogDescription>
            Sisteme giriş yapabilecek yeni bir nöbetçi öğretmen veya yönetici tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Ad *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Soyad *</label>
              <Input
                type="text"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Kullanıcı Adı *</label>
            <Input
              type="text"
              placeholder="Örn: ahmetkaya"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Şifre * (En az 6 karakter)</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Kullanıcı Rolü</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-blue-600"
            >
              <option value="TEACHER">Nöbetçi Öğretmen</option>
              <option value="ADMIN">Yönetici (Admin)</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
              İptal
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              Kullanıcı Oluştur
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogHeader>
          <DialogTitle>Kullanıcı Bilgilerini Düzenle</DialogTitle>
          <DialogDescription>
            @{editingTeacher?.username} kullanıcısının bilgilerini ve şifresini güncelleyin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Ad *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Soyad *</label>
              <Input
                type="text"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
            <Input
              type="password"
              placeholder="Yeni şifre girin"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-blue-600"
            >
              <option value="TEACHER">Nöbetçi Öğretmen</option>
              <option value="ADMIN">Yönetici (Admin)</option>
            </select>
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
