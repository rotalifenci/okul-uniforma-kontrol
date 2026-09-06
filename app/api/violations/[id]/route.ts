import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { violationRepository } from '@/repositories/violation.repository';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('Yetkisiz erişim.', 'UNAUTHORIZED', 401);
    }

    const violation = await prisma.violation.findUnique({
      where: { id: params.id },
    });

    if (!violation) {
      return errorResponse('İhlal kaydı bulunamadı.', 'VIOLATION_NOT_FOUND', 404);
    }

    // Role check: Teacher can only cancel their own violation; Admin can cancel any
    if (user.role === 'TEACHER' && violation.teacher_id !== user.userId) {
      return errorResponse('Yalnızca kendi girdiğiniz ihlal kayıtlarını iptal edebilirsiniz.', 'FORBIDDEN', 403);
    }

    let reason = 'Öğretmen tarafından geri alındı / iptal edildi.';
    try {
      const body = await request.json();
      if (body?.reason) reason = body.reason;
    } catch {
      // JSON body optional
    }

    const updated = await violationRepository.cancelViolation(params.id, reason);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: 'VIOLATION_CANCELLED',
      entityType: 'VIOLATION',
      entityId: params.id,
      oldValue: violation,
      newValue: updated,
      ipAddress: ip,
      userAgent: userAgent,
    });

    return successResponse(updated, 'İhlal kaydı iptal edildi / geri alındı.');
  } catch (error) {
    console.error('Violation cancel error:', error);
    return errorResponse('İhlal kaydı iptal edilirken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
