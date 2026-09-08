import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { formatDateTR, VIOLATION_TYPE_MAP } from '@/lib/utils';
import * as xlsx from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { format: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return new NextResponse('Yetkisiz erişim.', { status: 401 });
    }

    const { format } = params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const sinif = searchParams.get('sinif') || undefined;
    const sube = searchParams.get('sube') || undefined;
    const type = searchParams.get('type') || undefined;
    const teacher_id = searchParams.get('teacher_id') || undefined;

    const where: any = { is_cancelled: false };
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    if (type) where.type = type;
    if (teacher_id) where.teacher_id = teacher_id;

    if (sinif || sube || search) {
      where.student = {};
      if (sinif) where.student.sinif = sinif;
      if (sube) where.student.sube = sube;
      if (search) {
        where.student.OR = [
          { ogrenci_no: { contains: search } },
          { ad_soyad: { contains: search } },
        ];
      }
    }

    const violations = await prisma.violation.findMany({
      where,
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
      include: {
        student: true,
        teacher: {
          select: { name: true, surname: true, username: true },
        },
      },
    });

    const schoolSetting = await prisma.systemSetting.findUnique({
      where: { key: 'school_name' },
    });
    const schoolName = schoolSetting?.value || 'Okul Üniforma Kontrol Sistemi';

    // Prepare table data
    const tableData = violations.map((v, index) => {
      const typeLabel = VIOLATION_TYPE_MAP[v.type]?.label || v.type;
      return {
        'Sıra': index + 1,
        'Tarih': formatDateTR(v.date),
        'Saat': v.time,
        'Öğrenci No': v.student?.ogrenci_no || '-',
        'Adı Soyadı': v.student?.ad_soyad || '-',
        'Sınıf': v.student ? `${v.student.sinif}-${v.student.sube}` : '-',
        'İhlal Türü': typeLabel,
        'Nöbetçi Öğretmen': v.duty_teacher_name || (v.teacher ? `${v.teacher.name} ${v.teacher.surname}` : '-'),
        'Nöbet Yeri': v.duty_location || '-',
        'Not': v.note || '-',
      };
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: `REPORT_EXPORT_${format.toUpperCase()}`,
      entityType: 'VIOLATION',
      ipAddress: ip,
      userAgent: userAgent,
      newValue: { count: violations.length, format },
    });

    // 1. CSV Export
    if (format === 'csv') {
      const worksheet = xlsx.utils.json_to_sheet(tableData);
      const csvOutput = xlsx.utils.sheet_to_csv(worksheet);
      // Add UTF-8 BOM so Excel opens Turkish characters correctly
      const csvWithBom = '\uFEFF' + csvOutput;

      return new NextResponse(csvWithBom, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="uniforma_raporu_${timestamp}.csv"`,
        },
      });
    }

    // 2. Excel (XLSX) Export
    if (format === 'xlsx') {
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(tableData);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'İhlal Raporu');
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="uniforma_raporu_${timestamp}.xlsx"`,
        },
      });
    }

    // 3. PDF Export
    if (format === 'pdf') {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(16);
      doc.text(schoolName, 14, 18);
      doc.setFontSize(12);
      doc.text('Kılık-Kıyafet & Üniforma Denetim Raporu', 14, 25);

      doc.setFontSize(9);
      doc.setTextColor(100);
      const dateRangeText = startDate || endDate
        ? `Tarih Aralığı: ${formatDateTR(startDate) || 'Başlangıç'} - ${formatDateTR(endDate) || 'Günümüz'}`
        : 'Tarih Aralığı: Tüm Kayıtlar';
      doc.text(`${dateRangeText} | Toplam İhlal: ${violations.length} | Rapor Tarihi: ${formatDateTR(new Date())}`, 14, 32);

      const headers = [['#', 'Tarih', 'Saat', 'No', 'Ad Soyad', 'Sınıf', 'İhlal Türü', 'Öğretmen', 'Nöbet Yeri', 'Not']];
      const rows = tableData.map((d) => [
        d['Sıra'],
        d['Tarih'],
        d['Saat'],
        d['Öğrenci No'],
        d['Adı Soyadı'],
        d['Sınıf'],
        d['İhlal Türü'],
        d['Nöbetçi Öğretmen'],
        d['Nöbet Yeri'],
        d['Not'],
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 38,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 58, 138] },
      });

      const pdfBuffer = doc.output('arraybuffer');
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="uniforma_raporu_${timestamp}.pdf"`,
        },
      });
    }

    return new NextResponse('Desteklenmeyen dosya formatı.', { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Rapor oluşturulurken bir hata oluştu.', { status: 500 });
  }
}
