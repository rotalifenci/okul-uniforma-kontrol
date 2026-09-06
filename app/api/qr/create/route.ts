import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/response';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('QR kodu oluşturmak için önce yetkili bir oturum açılmış olmalıdır.', 'UNAUTHORIZED', 401);
    }

    // Generate secure unpredictable random token
    const token = crypto.randomBytes(32).toString('hex');
    const validitySeconds = 60; // 60 seconds validity
    const expiresAt = new Date(Date.now() + validitySeconds * 1000);

    const qrSession = await prisma.qrSession.create({
      data: {
        token,
        user_id: user.userId,
        status: 'PENDING',
        expires_at: expiresAt,
      },
    });

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const loginUrl = `${protocol}://${host}/mobile-login?token=${token}`;

    const qrDataUrl = await QRCode.toDataURL(loginUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff',
      },
    });

    return successResponse({
      token,
      loginUrl,
      qrDataUrl,
      expiresAt: expiresAt.toISOString(),
      validitySeconds,
    });
  } catch (error) {
    console.error('QR create error:', error);
    return errorResponse('QR kod oluşturulurken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
