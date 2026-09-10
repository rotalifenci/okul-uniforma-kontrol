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
    const search = searchParams.get('search')?.trim() || undefined;
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

    if (sinif || sube || search) {
      where.student = {};
      if (sinif) where.student.sinif = sinif;
      if (sube) where.student.sube = sube;
      if (search) {
        where.student.OR = [
          { ogrenci_no: { contains: search } },
          { ad_soyad: { contains: search } },
        ];
      }
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
      PHYSICAL_EDUCATION_UNIFORM: 0,
      CIVIL_CLOTHES: 0,
      INAPPROPRIATE_CLOTHING: 0,
      OTHER: 0,
    };

    const studentMap: Record<string, {
      student: any;
      violation_count: number;
      types: Record<string, number>;
      last_violation: any;
      violations: any[];
    }> = {};

    violations.forEach((v) => {
      typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
      
      if (v.student) {
        if (!studentMap[v.student_id]) {
          studentMap[v.student_id] = {
            student: v.student,
            violation_count: 0,
            types: {},
            last_violation: v,
            violations: [],
          };
        }
        studentMap[v.student_id].violation_count += 1;
        studentMap[v.student_id].types[v.type] = (studentMap[v.student_id].types[v.type] || 0) + 1;
        studentMap[v.student_id].violations.push({
          id: v.id,
          date: v.date,
          time: v.time,
          type: v.type,
          note: v.note,
        });
      }
    });

    const studentSummary = Object.values(studentMap)
      .map((item) => ({
        student: {
          ...item.student,
          created_at: item.student.created_at?.toISOString?.() || item.student.created_at,
          updated_at: item.student.updated_at?.toISOString?.() || item.student.updated_at,
        },
        violation_count: item.violation_count,
        is_repeat: item.violation_count >= 2,
        types: item.types,
        last_violation: {
          ...item.last_violation,
          created_at: item.last_violation.created_at?.toISOString?.() || item.last_violation.created_at,
          updated_at: item.last_violation.updated_at?.toISOString?.() || item.last_violation.updated_at,
        },
        violations: item.violations,
      }))
      .sort((a, b) => b.violation_count - a.violation_count || a.student.ad_soyad.localeCompare(b.student.ad_soyad, 'tr'));

    const repeatStudentCount = studentSummary.filter((s) => s.violation_count >= 2).length;

    const summary = {
      total_violations: violations.length,
      upper_missing: typeCounts.UPPER_UNIFORM_MISSING,
      lower_missing: typeCounts.LOWER_UNIFORM_MISSING,
      pe_uniform: typeCounts.PHYSICAL_EDUCATION_UNIFORM,
      civil_clothes: typeCounts.CIVIL_CLOTHES,
      inappropriate: typeCounts.INAPPROPRIATE_CLOTHING,
      other: typeCounts.OTHER,
      repeat_student_count: repeatStudentCount,
      unique_student_count: studentSummary.length,
    };

    return successResponse({
      summary,
      studentSummary,
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
