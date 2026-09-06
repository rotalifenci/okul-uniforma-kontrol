import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { userRepository } from '@/repositories/user.repository';
import { errorResponse, successResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = await getCurrentUserFromRequest(request);
    if (!payload) {
      return errorResponse('Oturum açılmamış.', 'UNAUTHORIZED', 401);
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.active) {
      return errorResponse('Kullanıcı hesabı aktif değil veya bulunamadı.', 'UNAUTHORIZED', 401);
    }

    return successResponse({
      id: user.id,
      username: user.username,
      name: user.name,
      surname: user.surname,
      role: user.role,
      last_login_at: user.last_login_at,
    });
  } catch (error) {
    return errorResponse('Kullanıcı bilgisi alınamadı.', 'INTERNAL_ERROR', 500);
  }
}
