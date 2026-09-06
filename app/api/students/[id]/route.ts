import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { studentRepository } from '@/repositories/student.repository';
import { StudentUpdateSchema } from '@/schemas';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('Yetkisiz erişim.', 'UNAUTHORIZED', 401);
    }

    const student = await studentRepository.findById(params.id);
    if (!student) {
      return errorResponse('Öğrenci bulunamadı.', 'STUDENT_NOT_FOUND', 404);
    }

    // Mask guardian phone for teachers unless authorized
    if (user.role === 'TEACHER' && student.veli_telefon) {
      student.veli_telefon = student.veli_telefon.substring(0, 4) + '***' + student.veli_telefon.substring(student.veli_telefon.length - 2);
    }

    return successResponse(student);
  } catch (error) {
    console.error('Student GET by ID error:', error);
    return errorResponse('Öğrenci bilgisi alınamadı.', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Öğrenci düzenleme yetkiniz bulunmamaktadır.', 'FORBIDDEN', 403);
    }

    const currentStudent = await studentRepository.findById(params.id);
    if (!currentStudent) {
      return errorResponse('Öğrenci bulunamadı.', 'STUDENT_NOT_FOUND', 404);
    }

    const body = await request.json();
    const validated = StudentUpdateSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse(validated.error.errors[0]?.message || 'Geçersiz veri.', 'VALIDATION_ERROR', 400);
    }

    if (validated.data.ogrenci_no && validated.data.ogrenci_no !== currentStudent.ogrenci_no) {
      const existing = await studentRepository.findByOgrenciNo(validated.data.ogrenci_no);
      if (existing && existing.id !== params.id) {
        return errorResponse('Bu öğrenci numarası başka bir öğrencide kayıtlı.', 'DUPLICATE_STUDENT_NO', 400);
      }
    }

    const updated = await studentRepository.update(params.id, validated.data);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: 'STUDENT_UPDATED',
      entityType: 'STUDENT',
      entityId: params.id,
      oldValue: currentStudent,
      newValue: updated,
      ipAddress: ip,
      userAgent: userAgent,
    });

    return successResponse(updated, 'Öğrenci bilgileri güncellendi.');
  } catch (error) {
    console.error('Student PATCH error:', error);
    return errorResponse('Öğrenci güncellenirken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Bu işlem için yönetici yetkisi gereklidir.', 'FORBIDDEN', 403);
    }

    const currentStudent = await studentRepository.findById(params.id);
    if (!currentStudent) {
      return errorResponse('Öğrenci bulunamadı.', 'STUDENT_NOT_FOUND', 404);
    }

    const updated = await studentRepository.toggleActive(params.id);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: updated.aktif ? 'STUDENT_ACTIVATED' : 'STUDENT_DEACTIVATED',
      entityType: 'STUDENT',
      entityId: params.id,
      ipAddress: ip,
      userAgent: userAgent,
    });

    return successResponse(
      updated,
      updated.aktif ? 'Öğrenci aktif duruma getirildi.' : 'Öğrenci pasife alındı.'
    );
  } catch (error) {
    console.error('Student toggle error:', error);
    return errorResponse('Öğrenci durumu değiştirilirken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
