import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { setAuthCookie, signToken } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return errorResponse('Geçersiz QR token.', 'INVALID_TOKEN', 400);
    }

    const session = await prisma.qrSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return errorResponse('QR kod oturumu bulunamadı.', 'SESSION_NOT_FOUND', 404);
    }

    if (session.status !== 'PENDING') {
      return errorResponse('Bu QR kod daha önce kullanılmış veya geçersiz.', 'ALREADY_USED', 400);
    }

    if (new Date() > session.expires_at) {
      await prisma.qrSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      return errorResponse('QR kodunun süresi dolmuş. Lütfen yenileyiniz.', 'EXPIRED', 400);
    }

    if (!session.user || !session.user.active) {
      return errorResponse('Kullanıcı hesabı pasif veya geçersiz.', 'USER_INACTIVE', 403);
    }

    // Mark as consumed
    await prisma.qrSession.update({
      where: { id: session.id },
      data: { status: 'CONSUMED' },
    });

    // Generate JWT
    const tokenPayload = {
      userId: session.user.id,
      username: session.user.username,
      role: session.user.role as any,
      name: session.user.name,
      surname: session.user.surname,
    };

    const authToken = await signToken(tokenPayload, '30d');
    setAuthCookie(authToken, true);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: session.user.id,
      action: 'QR_LOGIN_VERIFIED',
      entityType: 'AUTH',
      entityId: session.id,
      ipAddress: ip,
      userAgent: userAgent,
      newValue: { username: session.user.username, role: session.user.role },
    });

    return successResponse({
      user: {
        id: session.user.id,
        username: session.user.username,
        name: session.user.name,
        surname: session.user.surname,
        role: session.user.role,
      },
      token: authToken,
      redirectTo: session.user.role === 'ADMIN' ? '/admin' : '/teacher',
    }, 'QR kod ile giriş başarılı.');
  } catch (error) {
    console.error('QR verify error:', error);
    return errorResponse('QR doğrulanırken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
