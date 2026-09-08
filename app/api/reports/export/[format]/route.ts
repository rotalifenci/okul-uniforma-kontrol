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
      const pageWidth = doc.internal.pageSize.getWidth();

      const toPdfText = (str: string | null | undefined) => {
        if (!str) return '-';
        return String(str)
          .replace(/ğ/g, 'g')
          .replace(/Ğ/g, 'G')
          .replace(/ş/g, 's')
          .replace(/Ş/g, 'S')
          .replace(/ı/g, 'i')
          .replace(/İ/g, 'I')
          .replace(/ç/g, 'c')
          .replace(/Ç/g, 'C')
          .replace(/ö/g, 'o')
          .replace(/Ö/g, 'O')
          .replace(/ü/g, 'u')
          .replace(/Ü/g, 'U');
      };

      // Header Centered
      doc.setFontSize(15);
      doc.text(toPdfText(schoolName), pageWidth / 2, 16, { align: 'center' });
      doc.setFontSize(11);
      doc.text(toPdfText('Kılık-Kıyafet & Üniforma Denetim Raporu'), pageWidth / 2, 23, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(100);
      const dateRangeText = startDate || endDate
        ? `Tarih Araligi: ${formatDateTR(startDate) || 'Baslangic'} - ${formatDateTR(endDate) || 'Gunumuz'}`
        : 'Tarih Araligi: Tum Kayitlar';
      doc.text(`${toPdfText(dateRangeText)} | Toplam IhlaI: ${violations.length} | Rapor Tarihi: ${formatDateTR(new Date())}`, pageWidth / 2, 30, { align: 'center' });

      const headers = [['#', 'Tarih', 'Saat', 'No', 'Adi Soyadi', 'Sinif', 'Ihlal Turu', 'Ogretmen', 'Not']];
      const rows = tableData.map((d) => [
        d['Sıra'],
        d['Tarih'],
        d['Saat'],
        d['Öğrenci No'],
        toPdfText(d['Adı Soyadı']),
        d['Sınıf'],
        toPdfText(d['İhlal Türü']),
        toPdfText(d['Nöbetçi Öğretmen']),
        toPdfText(d['Not']),
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 36,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
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
