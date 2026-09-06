import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { reportRepository } from '@/repositories/report.repository';
import { errorResponse, successResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('Yetkisiz erişim.', 'UNAUTHORIZED', 401);
    }

    const stats = await reportRepository.getDashboardStats();
    return successResponse(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return errorResponse('Dashboard verileri alınırken bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
