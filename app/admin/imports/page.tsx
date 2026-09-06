'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  FileDown,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as xlsx from 'xlsx';

export default function AdminImportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    errors: { row: number; ogrenci_no: string; ad_soyad: string; error: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        ogrenci_no: '1001',
        ad_soyad: 'Ahmet Yılmaz',
        sinif: '9',
        sube: 'A',
        veli_telefon: '05321112233',
        profil_resmi_url: '',
      },
      {
        ogrenci_no: '1002',
        ad_soyad: 'Ayşe Kaya',
        sinif: '9',
        sube: 'B',
        veli_telefon: '05442223344',
        profil_resmi_url: '',
      },
      {
        ogrenci_no: '1003',
        ad_soyad: 'Mehmet Demir',
        sinif: '10',
        sube: 'A',
        veli_telefon: '05553334455',
        profil_resmi_url: '',
      },
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Örnek Öğrenci Listesi');
    xlsx.writeFile(workbook, 'ogrenci_sablonu.xlsx');
    toast.success('Örnek şablon indirildi.');
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      toast.error('Lütfen bir dosya seçiniz.');
      return;
    }

    setIsUploading(true);
    setProgress(15);

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        return p + 15;
      });
    }, 150);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
        toast.success(json.message || 'İçe aktarma tamamlandı.');
      } else {
        toast.error(json.message || 'İçe aktarma sırasında bir sorun oluştu.');
      }
    } catch {
      clearInterval(progressInterval);
      toast.error('Sunucu bağlantı hatası.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadErrorCsv = () => {
    if (!result || !result.errors.length) return;

    const worksheet = xlsx.utils.json_to_sheet(
      result.errors.map((err) => ({
        'Satır': err.row,
        'Öğrenci No': err.ogrenci_no,
        'Ad Soyad': err.ad_soyad,
        'Hata Açıklaması': err.error,
      }))
    );
    const csvOutput = xlsx.utils.sheet_to_csv(worksheet);
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hatali_satirlar.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Toplu Öğrenci İçe Aktar (CSV / Excel)
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Mevcut okul listelerinizi (Excel veya CSV) tek seferde sisteme yükleyin
          </p>
        </div>

        <Button
          onClick={downloadSampleTemplate}
          variant="outline"
          className="font-semibold h-10 rounded-xl border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300"
        >
          <FileDown className="h-4 w-4 mr-2" /> Örnek Excel Şablonunu İndir
        </Button>
      </div>

      {/* Upload Zone Card */}
      <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 rounded-3xl p-8 md:p-12 text-center cursor-pointer bg-blue-50/30 dark:bg-blue-950/15 transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-sm">
              <UploadCloud className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-bold text-foreground mt-4">
              {file ? file.name : 'Excel veya CSV dosyanızı buraya sürükleyin'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              veya dosya seçmek için bu alana tıklayın (.xlsx, .xls, .csv)
            </p>

            {file && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>

          {/* Upload Button & Progress */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>Numara ve Ad Soyad alanları zorunludur. Mükerrer numaralar otomatik filtrelenir.</span>
            </div>

            <Button
              onClick={handleUploadSubmit}
              disabled={!file || isUploading}
              className="w-full sm:w-auto min-w-[180px] bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-md"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Veriler işleniyor... %{progress}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4" /> İçe Aktarmayı Başlat
                </span>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-4 w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Summary & Errors */}
      {result && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-border bg-card p-4">
              <span className="text-xs font-semibold text-muted-foreground">İşlenen Toplam Satır</span>
              <p className="text-2xl font-black text-foreground mt-1">{result.totalProcessed}</p>
            </Card>

            <Card className="rounded-2xl border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Başarılı Kayıt
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{result.successCount}</p>
            </Card>

            <Card className="rounded-2xl border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20 p-4">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Hatalı / Atlanan Satır
              </span>
              <p className="text-2xl font-black text-rose-600 mt-1">{result.errorCount}</p>
            </Card>
          </div>

          {/* Error Table & Download Error CSV */}
          {result.errors.length > 0 && (
            <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-rose-600">
                    Hatalı Satırlar Listesi ({result.errors.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Bu satırlar format hatası veya mükerrer numara sebebiyle içe aktarılamadı
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadErrorCsv}
                  className="text-xs font-bold border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Hatalı Satırları CSV İndir
                </Button>
              </CardHeader>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-3 pl-4">Satır No</th>
                      <th className="p-3">Öğrenci No</th>
                      <th className="p-3">Ad Soyad</th>
                      <th className="p-3 pr-4">Hata Nedeni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {result.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-3 pl-4 font-bold text-muted-foreground">{err.row}</td>
                        <td className="p-3 font-bold text-foreground">{err.ogrenci_no}</td>
                        <td className="p-3">{err.ad_soyad || '-'}</td>
                        <td className="p-3 pr-4 font-semibold text-rose-600">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
