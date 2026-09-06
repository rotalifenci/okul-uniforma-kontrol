'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { Student } from '@/types';
import { cacheStudentsLocally, searchLocalStudents } from '@/lib/offline-storage';
import { getCurrentIstanbulDate, getCurrentIstanbulTime, VIOLATION_TYPE_MAP } from '@/lib/utils';
import { AppHeader } from '@/components/app-header';
import { TeacherBottomNav } from '@/components/teacher-bottom-nav';
import { QrLoginModal } from '@/components/qr-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Search,
  User,
  AlertTriangle,
  Shirt,
  Scissors,
  UserX,
  MoreHorizontal,
  RotateCcw,
  CheckCircle2,
  FileText,
  Clock,
  Delete,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeacherPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { isOnline, queueViolation } = useSyncStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Duplicate warning modal state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    type: string;
    student: Student;
    message: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Check role authorization
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Debounced student search
  const performSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    if (isOnline) {
      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(trimmed)}&limit=8`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSearchResults(json.data);
          cacheStudentsLocally(json.data);

          if (json.data.length === 1 && /^\d+$/.test(trimmed) && json.data[0].ogrenci_no === trimmed) {
            setSelectedStudent(json.data[0]);
          }
        }
      } catch (e) {
        const local = await searchLocalStudents(trimmed);
        setSearchResults(local);
      } finally {
        setIsSearching(false);
      }
    } else {
      const local = await searchLocalStudents(trimmed);
      setSearchResults(local);
      setIsSearching(false);
      if (local.length === 1 && /^\d+$/.test(trimmed) && local[0].ogrenci_no === trimmed) {
        setSelectedStudent(local[0]);
      }
    }
  }, [isOnline]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchResults([]);
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setSearchResults([]);
    setNote('');
    setShowNoteInput(false);
    setDuplicateWarning(null);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);
  };

  const handleRecordViolation = async (type: string, allowDuplicate = false) => {
    if (!selectedStudent || isSubmitting) return;

    setIsSubmitting(true);
    const client_tx_id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const today = getCurrentIstanbulDate();
    const time = getCurrentIstanbulTime();
    const activeTeacherName = user ? `${user.name} ${user.surname}` : 'Nöbetçi Öğretmen';

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }

    if (!isOnline) {
      await queueViolation({
        client_transaction_id: client_tx_id,
        student_id: selectedStudent.id,
        student_no: selectedStudent.ogrenci_no,
        student_name: selectedStudent.ad_soyad,
        type,
        note: note.trim() || undefined,
        date: today,
        time,
      });

      const studentName = selectedStudent.ad_soyad;
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">Çevrimdışı Kaydedildi (Kuyruğa Eklendi)</span>
          <span className="text-xs text-muted-foreground">{studentName} - {VIOLATION_TYPE_MAP[type]?.label || type}</span>
        </div>
      );

      handleReset();
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          type,
          note: note.trim() || undefined,
          date: today,
          time,
          client_transaction_id: client_tx_id,
          allow_duplicate: allowDuplicate,
        }),
      });

      const json = await res.json();

      if (res.status === 409 && json.error?.code === 'DUPLICATE_VIOLATION_TODAY') {
        setDuplicateWarning({
          type,
          student: selectedStudent,
          message: json.message || 'Bu öğrenci için bugün aynı ihlal zaten kaydedilmiş.',
        });
        setIsSubmitting(false);
        return;
      }

      if (json.success && json.data) {
        const createdViolationId = json.data.id;
        const studentName = selectedStudent.ad_soyad;
        const typeLabel = VIOLATION_TYPE_MAP[type]?.label || type;

        toast.success(
          <div className="flex items-center justify-between gap-3 w-full">
            <div>
              <p className="font-bold text-sm">İhlal kaydedildi</p>
              <p className="text-xs text-muted-foreground">{studentName} • {typeLabel}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await fetch(`/api/violations/${createdViolationId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'Öğretmen hızlı geri alma butonuna bastı.' }),
                  });
                  toast.info('İhlal kaydı geri alındı.');
                } catch {
                  toast.error('Geri alma işlemi başarısız.');
                }
              }}
              className="h-8 px-3 text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Geri Al
            </Button>
          </div>,
          { duration: 5000 }
        );

        handleReset();
      } else {
        toast.error(json.message || 'İhlal kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      toast.error('Sunucu ile iletişim kurulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeypadTap = (digit: string) => {
    setSearchQuery((prev) => prev + digit);
  };

  const handleKeypadBackspace = () => {
    setSearchQuery((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStudent(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-8 flex flex-col">
      <AppHeader
        title="Nöbetçi Öğretmen Kontrol Paneli"
        onOpenQr={() => setShowQrModal(true)}
      />

      <main className="flex-1 max-w-lg w-full mx-auto p-3 sm:p-4 space-y-3">
        {/* Step 1: Rapid Search Box */}
        <div className="relative z-20">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <Input
              ref={searchInputRef}
              type="text"
              inputMode="numeric"
              placeholder="Öğrenci No veya Ad Soyad girin..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedStudent) setSelectedStudent(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  handleSelectStudent(searchResults[0]);
                }
              }}
              className="h-14 pl-11 pr-20 text-lg font-semibold rounded-2xl shadow-sm border-blue-200 dark:border-blue-900 focus-visible:ring-blue-600 bg-card"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Temizle
                </Button>
              </div>
            )}
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchQuery && !selectedStudent && (
            <div className="mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden divide-y divide-border/60 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Öğrenci aranıyor...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStudent(st)}
                    className="w-full text-left p-3.5 flex items-center justify-between hover:bg-blue-50/70 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm overflow-hidden flex-shrink-0">
                        {st.profil_resmi_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={st.profil_resmi_url} alt={st.ad_soyad} className="w-full h-full object-cover" />
                        ) : (
                          st.ad_soyad[0]
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{st.ad_soyad}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          No: <strong className="text-blue-600 dark:text-blue-400 font-bold">{st.ogrenci_no}</strong> • <span className="font-bold">{st.sinif}-{st.sube}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {st.is_repeat_offender && (
                        <Badge variant="repeat" className="text-[10px] px-2 py-0.5">
                          🔴 {st.weekly_violations_count} İhlal
                        </Badge>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-5 text-center text-muted-foreground">
                  <p className="text-sm font-semibold">Bu numaraya ait öğrenci bulunamadı.</p>
                  <p className="text-xs mt-1">Lütfen numarayı veya adı kontrol ediniz.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Student Profile Card & Instant Violation Buttons */}
        {selectedStudent ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Student Card */}
            <Card className="border-2 border-blue-500/30 bg-card shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-extrabold text-xl overflow-hidden border border-blue-200 dark:border-blue-800 shadow-sm flex-shrink-0">
                      {selectedStudent.profil_resmi_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedStudent.profil_resmi_url}
                          alt={selectedStudent.ad_soyad}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedStudent.ad_soyad[0]
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                          {selectedStudent.ad_soyad}
                        </h2>
                        {selectedStudent.is_repeat_offender && (
                          <Badge variant="repeat" className="text-[11px] font-extrabold py-0.5 px-2.5">
                            🔴 Tekrarlayan İhlal ({selectedStudent.weekly_violations_count})
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-semibold">
                        <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold">
                          {selectedStudent.sinif}-{selectedStudent.sube}
                        </span>
                        <span>•</span>
                        <span>No: <strong className="text-blue-600 dark:text-blue-400 font-bold">{selectedStudent.ogrenci_no}</strong></span>
                        {selectedStudent.cinsiyet && (
                          <>
                            <span>•</span>
                            <span>{selectedStudent.cinsiyet}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    Değiştir
                  </Button>
                </div>

                {/* History Badge Bar */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-3">
                    <span>Bu Hafta: <strong className={selectedStudent.weekly_violations_count ? 'text-rose-600 font-bold' : 'text-foreground'}>{selectedStudent.weekly_violations_count || 0}</strong></span>
                    <span>Toplam: <strong className="text-foreground">{selectedStudent.violations_count || 0}</strong></span>
                  </div>
                  {selectedStudent.last_violation_date && (
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      <span>Son: {selectedStudent.last_violation_date}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: BIG 1-Tap Touch Violation Buttons */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                İhlal Türünü Seçin (Tek Dokunuşla Kaydeder)
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRecordViolation('UPPER_UNIFORM_MISSING')}
                  className="h-16 w-full rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-md transition-all flex items-center justify-between px-5 font-extrabold text-base disabled:opacity-50"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Shirt className="h-6 w-6" />
                    </div>
                    <span>ÜST FORMA EKSİK</span>
                  </div>
                  <span className="text-xs bg-white/25 px-2.5 py-1 rounded-lg">KAYDET</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRecordViolation('LOWER_UNIFORM_MISSING')}
                  className="h-16 w-full rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white shadow-md transition-all flex items-center justify-between px-5 font-extrabold text-base disabled:opacity-50"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Scissors className="h-6 w-6" />
                    </div>
                    <span>ALT FORMA EKSİK</span>
                  </div>
                  <span className="text-xs bg-white/25 px-2.5 py-1 rounded-lg">KAYDET</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRecordViolation('CIVIL_CLOTHES')}
                  className="h-16 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white shadow-md transition-all flex items-center justify-between px-5 font-extrabold text-base disabled:opacity-50"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <UserX className="h-6 w-6" />
                    </div>
                    <span>TAMAMEN SİVİL / UYGUNSUZ</span>
                  </div>
                  <span className="text-xs bg-white/25 px-2.5 py-1 rounded-lg">KAYDET</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRecordViolation('OTHER')}
                  className="h-14 w-full rounded-2xl bg-slate-700 hover:bg-slate-800 active:scale-[0.98] text-white shadow transition-all flex items-center justify-between px-5 font-bold text-sm disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      <MoreHorizontal className="h-5 w-5" />
                    </div>
                    <span>DİĞER KILIK-KIYAFET İHLALİ</span>
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">KAYDET</span>
                </button>
              </div>

              {/* Optional Note Expander */}
              <div className="pt-2">
                {!showNoteInput ? (
                  <button
                    type="button"
                    onClick={() => setShowNoteInput(true)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline px-1"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    + İsteğe Bağlı Not Ekle (Mont vb.)
                  </button>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <label className="text-xs font-bold text-muted-foreground flex items-center justify-between px-1">
                      <span>İsteğe Bağlı Not</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNoteInput(false);
                          setNote('');
                        }}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Kapat
                      </button>
                    </label>
                    <Input
                      type="text"
                      placeholder="Örn: Mont ile forma kapatılmış, uyarılmıştır."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Fast Numeric Keypad */
          <div className="mt-3 bg-card rounded-2xl border border-border p-3 shadow-sm space-y-3">
            <div className="flex items-center justify-between px-2 text-xs text-muted-foreground font-semibold">
              <span>Hızlı Numara Tuş Takımı</span>
              <span className="text-[11px]">Tek Elle Kolay Kullanım</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadTap(digit)}
                  className="h-14 rounded-xl bg-muted/60 hover:bg-muted active:bg-blue-600 active:text-white font-extrabold text-2xl text-foreground transition-colors shadow-sm flex items-center justify-center select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-14 rounded-xl bg-muted/40 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/40 font-bold text-xs text-muted-foreground transition-colors flex items-center justify-center select-none"
              >
                TEMİZLE
              </button>
              <button
                type="button"
                onClick={() => handleKeypadTap('0')}
                className="h-14 rounded-xl bg-muted/60 hover:bg-muted active:bg-blue-600 active:text-white font-extrabold text-2xl text-foreground transition-colors shadow-sm flex items-center justify-center select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-14 rounded-xl bg-muted/40 hover:bg-muted active:bg-muted/80 font-bold text-sm text-foreground transition-colors flex items-center justify-center select-none"
              >
                <Delete className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Duplicate Warning Dialog */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Mükerrer Kayıt Uyarısı</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              <strong>{duplicateWarning.student.ad_soyad}</strong> ({duplicateWarning.student.sinif}-{duplicateWarning.student.sube}) için bugün zaten bu ihlal türü kaydedilmiş.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDuplicateWarning(null)}
              >
                Vazgeç
              </Button>
              <Button
                variant="amber"
                className="flex-1 font-bold"
                onClick={() => {
                  const type = duplicateWarning.type;
                  setDuplicateWarning(null);
                  handleRecordViolation(type, true);
                }}
              >
                Yine de Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic QR Share Modal */}
      <QrLoginModal open={showQrModal} onOpenChange={setShowQrModal} />

      {/* Teacher Mobile Bottom Nav */}
      <TeacherBottomNav onOpenQr={() => setShowQrModal(true)} />
    </div>
  );
}
