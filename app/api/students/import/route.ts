import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Öğrenci içe aktarma yetkiniz bulunmamaktadır.', 'FORBIDDEN', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('Lütfen bir CSV veya Excel dosyası yükleyiniz.', 'FILE_REQUIRED', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rawRows || rawRows.length < 2) {
      return errorResponse('Dosya boş veya başlık satırı bulunamadı.', 'EMPTY_FILE', 400);
    }

    // Header row normalization
    const headerRow: string[] = (rawRows[0] || []).map((h: any) => String(h || '').trim().toLowerCase());

    // Detect column indexes
    let noIdx = headerRow.findIndex((h) => h.includes('no') || h.includes('numara') || h === 'ogrenci_no');
    let nameIdx = headerRow.findIndex((h) => h.includes('ad') || h.includes('isim') || h.includes('soyad') || h === 'ad_soyad');
    let classIdx = headerRow.findIndex((h) => h.includes('sinif') || h.includes('sınıf') || h === 'grade');
    let branchIdx = headerRow.findIndex((h) => h.includes('sube') || h.includes('şube') || h === 'branch');
    let phoneIdx = headerRow.findIndex((h) => h.includes('telefon') || h.includes('tel') || h.includes('veli'));
    let photoIdx = headerRow.findIndex((h) => h.includes('foto') || h.includes('resim') || h.includes('url') || h.includes('avatar'));

    // Fallback if no header match found (assume standard columns: no, name, class, branch, phone, photo)
    if (noIdx === -1 && rawRows[0].length >= 2) {
      noIdx = 0;
      nameIdx = 1;
      classIdx = rawRows[0].length > 2 ? 2 : -1;
      branchIdx = rawRows[0].length > 3 ? 3 : -1;
    }

    const validStudentsToCreate: any[] = [];
    const errors: { row: number; ogrenci_no: string; ad_soyad: string; error: string }[] = [];
    const seenNosInFile = new Set<string>();

    // Fetch existing student numbers in DB
    const existingStudents = await prisma.student.findMany({
      select: { ogrenci_no: true },
    });
    const existingDbNos = new Set(existingStudents.map((s) => s.ogrenci_no));

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === '')) {
        continue; // Skip empty rows
      }

      const rowNumber = i + 1;
      const rawNo = row[noIdx] !== undefined ? String(row[noIdx]).trim() : '';
      const rawName = row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
      let rawClass = classIdx !== -1 && row[classIdx] !== undefined ? String(row[classIdx]).trim() : '';
      let rawBranch = branchIdx !== -1 && row[branchIdx] !== undefined ? String(row[branchIdx]).trim() : '';
      const rawPhone = phoneIdx !== -1 && row[phoneIdx] !== undefined ? String(row[phoneIdx]).trim() : '';
      const rawPhoto = photoIdx !== -1 && row[photoIdx] !== undefined ? String(row[photoIdx]).trim() : '';

      // Validate student number
      if (!rawNo) {
        errors.push({ row: rowNumber, ogrenci_no: '-', ad_soyad: rawName, error: 'Öğrenci numarası boş.' });
        continue;
      }

      if (!/^\d+$/.test(rawNo)) {
        errors.push({ row: rowNumber, ogrenci_no: rawNo, ad_soyad: rawName, error: 'Öğrenci numarası sadece rakamlardan oluşmalıdır.' });
        continue;
      }

      if (seenNosInFile.has(rawNo)) {
        errors.push({ row: rowNumber, ogrenci_no: rawNo, ad_soyad: rawName, error: 'Bu dosya içinde mükerrer (duplicate) öğrenci numarası.' });
        continue;
      }

      if (existingDbNos.has(rawNo)) {
        errors.push({ row: rowNumber, ogrenci_no: rawNo, ad_soyad: rawName, error: 'Bu öğrenci numarası veritabanında zaten kayıtlı.' });
        continue;
      }

      // Validate name
      if (!rawName || rawName.length < 2) {
        errors.push({ row: rowNumber, ogrenci_no: rawNo, ad_soyad: rawName, error: 'Ad Soyad en az 2 karakter olmalıdır.' });
        continue;
      }

      // Format class and branch if merged (e.g., "9/A" or "9-A" or "10A")
      if (!rawBranch && rawClass) {
        const match = rawClass.match(/^(\d+)[-/ ]?([A-Za-zĞÜŞİÖÇğüşıöç])$/);
        if (match) {
          rawClass = match[1];
          rawBranch = match[2].toUpperCase();
        }
      }

      if (!rawClass) rawClass = '9';
      if (!rawBranch) rawBranch = 'A';

      seenNosInFile.add(rawNo);

      const avatarSeed = encodeURIComponent(rawName.toLowerCase().replace(/\s+/g, '-'));
      const photoUrl = rawPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;

      validStudentsToCreate.push({
        ogrenci_no: rawNo,
        ad_soyad: rawName,
        sinif: rawClass,
        sube: rawBranch.toUpperCase(),
        veli_telefon: rawPhone || null,
        profil_resmi_url: photoUrl,
        aktif: true,
      });
    }

    // Insert valid students in transaction
    if (validStudentsToCreate.length > 0) {
      await prisma.student.createMany({
        data: validStudentsToCreate,
      });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: 'STUDENTS_IMPORTED',
      entityType: 'IMPORT',
      ipAddress: ip,
      userAgent: userAgent,
      newValue: {
        successCount: validStudentsToCreate.length,
        errorCount: errors.length,
        fileName: file.name,
      },
    });

    return successResponse({
      totalProcessed: validStudentsToCreate.length + errors.length,
      successCount: validStudentsToCreate.length,
      errorCount: errors.length,
      errors,
    }, `${validStudentsToCreate.length} öğrenci başarıyla içe aktarıldı. ${errors.length > 0 ? `${errors.length} satırda hata tespit edildi.` : ''}`);
  } catch (error: any) {
    console.error('Import error:', error);
    return errorResponse('İçe aktarma sırasında bir hata oluştu: ' + (error.message || ''), 'INTERNAL_ERROR', 500);
  }
}
