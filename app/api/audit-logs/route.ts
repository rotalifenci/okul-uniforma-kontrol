import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Yetkisiz erişim.', 'FORBIDDEN', 403);
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              surname: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return successResponse({
      items: logs.map((log) => ({
        ...log,
        created_at: log.created_at.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Audit logs GET error:', error);
    return errorResponse('Audit logları alınırken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
