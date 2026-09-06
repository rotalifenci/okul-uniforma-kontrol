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

    const analytics = await reportRepository.getClassAnalytics();
    return successResponse(analytics);
  } catch (error) {
    console.error('Analytics GET error:', error);
    return errorResponse('Sınıf analizleri alınamadı.', 'INTERNAL_ERROR', 500);
  }
}
