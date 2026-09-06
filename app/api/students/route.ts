import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { studentRepository } from '@/repositories/student.repository';
import { StudentCreateSchema } from '@/schemas';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('Yetkisiz erişim.', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search') || '';
    const sinif = searchParams.get('sinif') || undefined;
    const sube = searchParams.get('sube') || undefined;
    const aktifParam = searchParams.get('aktif');
    const aktif = aktifParam !== null ? aktifParam === 'true' : undefined;

    const data = await studentRepository.getAllPaginated({
      page,
      limit,
      search,
      sinif,
      sube,
      aktif,
    });

    return successResponse(data);
  } catch (error) {
    console.error('Students GET error:', error);
    return errorResponse('Öğrenciler yüklenirken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Öğrenci ekleme yetkiniz bulunmamaktadır.', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const validated = StudentCreateSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse(validated.error.errors[0]?.message || 'Geçersiz veri.', 'VALIDATION_ERROR', 400);
    }

    // Check duplicate ogrenci_no
    const existing = await studentRepository.findByOgrenciNo(validated.data.ogrenci_no);
    if (existing) {
      return errorResponse('Bu öğrenci numarası ile kayıtlı bir öğrenci zaten mevcut.', 'DUPLICATE_STUDENT_NO', 400);
    }

    const student = await studentRepository.create(validated.data);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: 'STUDENT_CREATED',
      entityType: 'STUDENT',
      entityId: student.id,
      ipAddress: ip,
      userAgent: userAgent,
      newValue: student,
    });

    return successResponse(student, 'Öğrenci başarıyla eklendi.', 201);
  } catch (error) {
    console.error('Student POST error:', error);
    return errorResponse('Öğrenci eklenirken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
