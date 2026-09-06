import prisma from '@/lib/prisma';
import { getCurrentIstanbulDate, getCurrentIstanbulTime } from '@/lib/utils';
import { Violation } from '@/types';

export class ViolationRepository {
  async createViolation({
    student_id,
    teacher_id,
    duty_teacher_name,
    duty_location,
    type,
    note,
    date,
    time,
    client_transaction_id,
    allow_duplicate = false,
  }: {
    student_id: string;
    teacher_id: string;
    duty_teacher_name?: string | null;
    duty_location?: string | null;
    type: string;
    note?: string | null;
    date?: string;
    time?: string;
    client_transaction_id?: string;
    allow_duplicate?: boolean;
  }) {
    const today = date || getCurrentIstanbulDate();
    const currentTime = time || getCurrentIstanbulTime();

    // Check client_transaction_id to prevent duplicates from offline sync
    if (client_transaction_id) {
      const existingTx = await prisma.violation.findUnique({
        where: { client_transaction_id },
      });
      if (existingTx) {
        return { violation: existingTx, duplicate: false, alreadySynced: true };
      }
    }

    // Check same day duplicate for this student & violation type
    if (!allow_duplicate) {
      const sameDayViolation = await prisma.violation.findFirst({
        where: {
          student_id,
          date: today,
          type,
          is_cancelled: false,
        },
      });

      if (sameDayViolation) {
        return {
          violation: null,
          duplicate: true,
          existingId: sameDayViolation.id,
          message: 'Bu öğrenci için bugün aynı ihlal türü zaten kaydedilmiş.',
        };
      }
    }

    const violation = await prisma.violation.create({
      data: {
        student_id,
        teacher_id,
        duty_teacher_name,
        duty_location,
        type,
        note,
        date: today,
        time: currentTime,
        client_transaction_id,
      },
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

    return { violation, duplicate: false, alreadySynced: false };
  }

  async cancelViolation(id: string, reason = 'Kullanıcı tarafından iptal edildi / geri alındı') {
    return prisma.violation.update({
      where: { id },
      data: {
        is_cancelled: true,
        cancelled_reason: reason,
      },
    });
  }

  async deleteViolation(id: string) {
    return prisma.violation.delete({
      where: { id },
    });
  }

  async getRecentViolations(limit = 10, teacher_id?: string) {
    const where: any = { is_cancelled: false };
    if (teacher_id) {
      where.teacher_id = teacher_id;
    }

    return prisma.violation.findMany({
      where,
      take: limit,
      orderBy: { created_at: 'desc' },
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
  }

  async getWeeklyViolations(startDate?: string, endDate?: string) {
    const today = getCurrentIstanbulDate();
    let mondayStr = startDate;
    let fridayStr = endDate;

    if (!mondayStr || !fridayStr) {
      const todayDateObj = new Date(today);
      const dayOfWeek = todayDateObj.getDay();
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const mondayObj = new Date(todayDateObj);
      mondayObj.setDate(todayDateObj.getDate() - distanceToMonday);
      mondayStr = mondayObj.toISOString().split('T')[0];

      const fridayObj = new Date(mondayObj);
      fridayObj.setDate(mondayObj.getDate() + 4);
      fridayStr = fridayObj.toISOString().split('T')[0];
    }

    const violations = await prisma.violation.findMany({
      where: {
        date: {
          gte: mondayStr,
          lte: fridayStr,
        },
        is_cancelled: false,
      },
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
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });

    return {
      startDate: mondayStr,
      endDate: fridayStr,
      violations,
    };
  }

  async getViolationsFiltered({
    startDate,
    endDate,
    sinif,
    sube,
    type,
    teacher_id,
    student_id,
    is_cancelled = false,
    page = 1,
    limit = 25,
  }: {
    startDate?: string;
    endDate?: string;
    sinif?: string;
    sube?: string;
    type?: string;
    teacher_id?: string;
    student_id?: string;
    is_cancelled?: boolean;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;
    const where: any = { is_cancelled };

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

    const [total, items] = await Promise.all([
      prisma.violation.count({ where }),
      prisma.violation.findMany({
        where,
        skip,
        take: limit,
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
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const violationRepository = new ViolationRepository();
