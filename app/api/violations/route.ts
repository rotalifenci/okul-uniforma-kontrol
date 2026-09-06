import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { violationRepository } from '@/repositories/violation.repository';
import { ViolationCreateSchema } from '@/schemas';
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
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const sinif = searchParams.get('sinif') || undefined;
    const sube = searchParams.get('sube') || undefined;
    const type = searchParams.get('type') || undefined;
    const teacher_id = searchParams.get('teacher_id') || (user.role === 'TEACHER' && searchParams.get('myOnly') === 'true' ? user.userId : undefined);
    const student_id = searchParams.get('student_id') || undefined;
    const is_cancelled = searchParams.get('is_cancelled') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const data = await violationRepository.getViolationsFiltered({
      startDate,
      endDate,
      sinif,
      sube,
      type,
      teacher_id,
      student_id,
      is_cancelled,
      page,
      limit,
    });

    return successResponse(data);
  } catch (error) {
    console.error('Violations GET error:', error);
    return errorResponse('İhlal kayıtları alınırken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('Yetkisiz erişim.', 'UNAUTHORIZED', 401);
    }

    const body = await request.json();
    const validated = ViolationCreateSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse(validated.error.errors[0]?.message || 'Geçersiz veri.', 'VALIDATION_ERROR', 400);
    }

    const {
      student_id,
      duty_teacher_name,
      duty_location,
      type,
      note,
      date,
      time,
      client_transaction_id,
      allow_duplicate,
    } = validated.data;

    const result = await violationRepository.createViolation({
      student_id,
      teacher_id: user.userId,
      duty_teacher_name: duty_teacher_name || `${user.name} ${user.surname}`,
      duty_location: duty_location || 'Okul Ana Girişi',
      type,
      note,
      date,
      time,
      client_transaction_id,
      allow_duplicate,
    });

    if (result.duplicate) {
      return errorResponse(
        result.message || 'Bu öğrenci için bugün aynı ihlal zaten kaydedilmiş.',
        'DUPLICATE_VIOLATION_TODAY',
        409,
        { existingId: result.existingId }
      );
    }

    if (result.alreadySynced) {
      return successResponse(result.violation, 'Kayıt zaten daha önce senkronize edilmiş.');
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: 'VIOLATION_CREATED',
      entityType: 'VIOLATION',
      entityId: result.violation?.id,
      ipAddress: ip,
      userAgent: userAgent,
      newValue: result.violation,
    });

    return successResponse(result.violation, 'İhlal kaydedildi.', 201);
  } catch (error) {
    console.error('Violation POST error:', error);
    return errorResponse('İhlal kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.', 'INTERNAL_ERROR', 500);
  }
}
