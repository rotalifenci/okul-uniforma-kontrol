import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentIstanbulDate } from '@/lib/utils';
import { errorResponse, successResponse } from '@/lib/response';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const violationTypes = await prisma.violationType.findMany({
      orderBy: { sort_order: 'asc' },
    });

    return successResponse({
      settings: settingsMap,
      violationTypes,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return errorResponse('Ayarlar yüklenemedi.', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Ayar değiştirme yetkiniz bulunmamaktadır.', 'FORBIDDEN', 403);
    }

    const body = await request.json();
    const { action, settings } = body;

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Action: Close Day
    if (action === 'CLOSE_DAY') {
      const today = getCurrentIstanbulDate();
      const violations = await prisma.violation.findMany({
        where: { date: today, is_cancelled: false },
        include: { student: true, teacher: true },
      });

      const summary = {
        date: today,
        total_violations: violations.length,
        teachers_count: new Set(violations.map((v) => v.teacher_id)).size,
        classes_count: new Set(violations.map((v) => `${v.student.sinif}-${v.student.sube}`)).size,
        closed_by: `${user.name} ${user.surname}`,
        closed_at: new Date().toISOString(),
      };

      await logAuditEvent({
        userId: user.userId,
        action: 'DAY_CLOSED',
        entityType: 'SETTING',
        entityId: today,
        newValue: summary,
        ipAddress: ip,
        userAgent: userAgent,
      });

      return successResponse(summary, `${today} tarihi için gün sonu kapanışı başarıyla yapıldı.`);
    }

    // Standard settings update
    if (settings && typeof settings === 'object') {
      for (const [key, val] of Object.entries(settings)) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) },
        });
      }

      await logAuditEvent({
        userId: user.userId,
        action: 'SETTINGS_UPDATED',
        entityType: 'SETTING',
        newValue: settings,
        ipAddress: ip,
        userAgent: userAgent,
      });

      return successResponse(settings, 'Sistem ayarları güncellendi.');
    }

    return errorResponse('Geçersiz işlem parametresi.', 'BAD_REQUEST', 400);
  } catch (error) {
    console.error('Settings POST error:', error);
    return errorResponse('Ayarlar güncellenirken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
