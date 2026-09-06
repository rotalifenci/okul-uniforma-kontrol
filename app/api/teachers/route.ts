import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { userRepository } from '@/repositories/user.repository';
import { UserCreateSchema, UserUpdateSchema } from '@/schemas';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Yetkisiz erişim.', 'FORBIDDEN', 403);
    }

    const teachers = await userRepository.getAllUsers();
    return successResponse(teachers);
  } catch (error) {
    console.error('Teachers GET error:', error);
    return errorResponse('Öğretmenler listelenirken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Öğretmen ekleme yetkiniz bulunmamaktadır.', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const validated = UserCreateSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse(validated.error.errors[0]?.message || 'Geçersiz veri.', 'VALIDATION_ERROR', 400);
    }

    const existing = await userRepository.findByUsername(validated.data.username);
    if (existing) {
      return errorResponse('Bu kullanıcı adı zaten kullanılıyor.', 'DUPLICATE_USERNAME', 400);
    }

    const newUser = await userRepository.createUser(validated.data);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: newUser.id,
      ipAddress: ip,
      userAgent: userAgent,
      newValue: { username: newUser.username, role: newUser.role, name: newUser.name, surname: newUser.surname },
    });

    return successResponse(newUser, 'Kullanıcı başarıyla oluşturuldu.', 201);
  } catch (error) {
    console.error('Teacher POST error:', error);
    return errorResponse('Kullanıcı oluşturulurken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Kullanıcı düzenleme yetkiniz bulunmamaktadır.', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return errorResponse('Kullanıcı ID zorunludur.', 'ID_REQUIRED', 400);
    }

    const existing = await userRepository.findById(id);
    if (!existing) {
      return errorResponse('Kullanıcı bulunamadı.', 'USER_NOT_FOUND', 404);
    }

    const updated = await userRepository.updateUser(id, updateData);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await logAuditEvent({
      userId: user.userId,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress: ip,
      userAgent: userAgent,
    });

    return successResponse(updated, 'Kullanıcı güncellendi.');
  } catch (error) {
    console.error('Teacher PATCH error:', error);
    return errorResponse('Kullanıcı güncellenirken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
