import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { studentRepository } from '@/repositories/student.repository';
import { errorResponse, successResponse } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return errorResponse('Yetkisiz erişim.', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const sinif = searchParams.get('sinif') || undefined;
    const sube = searchParams.get('sube') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20;

    const students = await studentRepository.searchStudents({
      query,
      sinif,
      sube,
      activeOnly: true,
      limit,
    });

    return successResponse(students);
  } catch (error) {
    console.error('Student search error:', error);
    return errorResponse('Öğrenci arama sırasında bir hata oluştu.', 'INTERNAL_ERROR', 500);
  }
}
