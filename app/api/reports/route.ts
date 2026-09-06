import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
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
    const sinif = searchParams.get('sinif') || undefined;
    const sube = searchParams.get('sube') || undefined;
    const type = searchParams.get('type') || undefined;
    const teacher_id = searchParams.get('teacher_id') || undefined;
    const student_id = searchParams.get('student_id') || undefined;

    const where: any = { is_cancelled: false };

    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    if (type) where.type = type;
    if (teacher_id) where.teacher_id = teacher_id;
    if (student_id) where.student_id = student_id;

    if (sinif || sube) {
      where.student = {};
      if (sinif) where.student.sinif = sinif;
      if (sube) where.student.sube = sube;
    }

    const violations = await prisma.violation.findMany({
      where,
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
      include: {
        student: true,
        teacher: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    // Calculate Summary stats for this filtered set
    const typeCounts: Record<string, number> = {
      UPPER_UNIFORM_MISSING: 0,
      LOWER_UNIFORM_MISSING: 0,
      CIVIL_CLOTHES: 0,
      INAPPROPRIATE_CLOTHING: 0,
      OTHER: 0,
    };

    const studentCounts: Record<string, number> = {};
    violations.forEach((v) => {
      typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
      studentCounts[v.student_id] = (studentCounts[v.student_id] || 0) + 1;
    });

    const repeatStudentCount = Object.values(studentCounts).filter((c) => c >= 2).length;

    const summary = {
      total_violations: violations.length,
      upper_missing: typeCounts.UPPER_UNIFORM_MISSING,
      lower_missing: typeCounts.LOWER_UNIFORM_MISSING,
      civil_clothes: typeCounts.CIVIL_CLOTHES,
      inappropriate: typeCounts.INAPPROPRIATE_CLOTHING,
      other: typeCounts.OTHER,
      repeat_student_count: repeatStudentCount,
      unique_student_count: Object.keys(studentCounts).length,
    };

    return successResponse({
      summary,
      items: violations.map((v) => ({
        ...v,
        created_at: v.created_at.toISOString(),
        updated_at: v.updated_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Reports GET error:', error);
    return errorResponse('Rapor verisi alınamadı.', 'INTERNAL_ERROR', 500);
  }
}
