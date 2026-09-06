import { NextRequest } from 'next/server';
import { LoginSchema } from '@/schemas';
import { userRepository } from '@/repositories/user.repository';
import { comparePassword, setAuthCookie, signToken } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse(validated.error.errors[0]?.message || 'Geçersiz giriş bilgileri.', 'VALIDATION_ERROR', 400);
    }

    const { username, password, remember_me } = validated.data;
    const user = await userRepository.findByUsername(username.toLowerCase().trim());

    if (!user || !user.active) {
      return errorResponse('Kullanıcı adı veya şifre hatalı.', 'INVALID_CREDENTIALS', 401);
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return errorResponse('Kullanıcı adı veya şifre hatalı.', 'INVALID_CREDENTIALS', 401);
    }

    // Update last login (non-blocking)
    try {
      await userRepository.updateLastLogin(user.id);
    } catch (e) {
      console.warn('Could not update last login timestamp:', e);
    }

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as any,
      name: user.name,
      surname: user.surname,
    };

    const token = await signToken(tokenPayload, remember_me ? '30d' : '1d');
    setAuthCookie(token, remember_me ?? true);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Log audit event (non-blocking)
    try {
      await logAuditEvent({
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        ipAddress: ip,
        userAgent: userAgent,
        newValue: { username: user.username, role: user.role },
      });
    } catch (e) {
      console.warn('Could not write login audit log:', e);
    }

    return successResponse({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        role: user.role,
      },
      token,
    }, 'Giriş başarılı.');
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse('Giriş yapılırken bir sorun oluştu. Lütfen tekrar deneyin.', 'INTERNAL_ERROR', 500);
  }
}
