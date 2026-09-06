import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { violationRepository } from '@/repositories/violation.repository';
import { errorResponse, successResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('Yetkisiz erişim.', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await violationRepository.getWeeklyViolations(startDate, endDate);
    return successResponse(data);
  } catch (error) {
    console.error('Calendar GET error:', error);
    return errorResponse('Takvim verileri alınamadı.', 'INTERNAL_ERROR', 500);
  }
}
