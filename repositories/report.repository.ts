import prisma from '@/lib/prisma';
import { getCurrentIstanbulDate, VIOLATION_TYPE_MAP } from '@/lib/utils';
import { DashboardStats, Violation, Student } from '@/types';

export class ReportRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    const today = getCurrentIstanbulDate();
    const [y, m, d] = today.split('-').map(Number);
    const todayDateObj = new Date(y, m - 1, d);
    const dayOfWeek = todayDateObj.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const mondayObj = new Date(y, m - 1, d - distanceToMonday);
    const sundayObj = new Date(y, m - 1, d - distanceToMonday + 6);

    const formatLocal = (dt: Date) => {
      const yStr = dt.getFullYear();
      const mStr = String(dt.getMonth() + 1).padStart(2, '0');
      const dStr = String(dt.getDate()).padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    };

    const mondayStr = formatLocal(mondayObj);
    const sundayStr = formatLocal(sundayObj);

    // Days Mon-Sun (7 days)
    const weekDays: { day_name: string; date: string }[] = [];
    const dayNamesTR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    for (let i = 0; i < 7; i++) {
      const dayDt = new Date(y, m - 1, d - distanceToMonday + i);
      weekDays.push({
        day_name: dayNamesTR[i],
        date: formatLocal(dayDt),
      });
    }

    // Parallel queries
    const [
      todayViolations,
      weeklyViolations,
      activeTeachersToday,
      recentViolations,
      allClasses,
    ] = await Promise.all([
      prisma.violation.findMany({
        where: { date: today, is_cancelled: false },
        include: { student: true },
      }),
      prisma.violation.findMany({
        where: {
          date: { gte: mondayStr, lte: sundayStr },
          is_cancelled: false,
        },
        include: { student: true, teacher: true },
      }),
      prisma.violation.findMany({
        where: { date: today, is_cancelled: false },
        distinct: ['teacher_id'],
        select: { teacher_id: true },
      }),
      prisma.violation.findMany({
        where: { is_cancelled: false },
        take: 10,
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
      prisma.student.findMany({
        where: { aktif: true },
        select: { id: true, sinif: true, sube: true },
      }),
    ]);

    // Daily trend
    const daily_trend = weekDays.map((wd) => {
      const count = weeklyViolations.filter((v) => v.date === wd.date).length;
      return {
        day_name: wd.day_name,
        date: wd.date,
        count,
      };
    });

    // Type distribution
    const typeCounts: Record<string, number> = {};
    weeklyViolations.forEach((v) => {
      typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
    });

    const type_distribution = Object.keys(VIOLATION_TYPE_MAP).map((typeKey) => {
      const typeInfo = VIOLATION_TYPE_MAP[typeKey];
      return {
        type: typeKey,
        name: typeInfo ? typeInfo.label : typeKey,
        count: typeCounts[typeKey] || 0,
        color: typeKey === 'UPPER_UNIFORM_MISSING' ? '#f59e0b'
          : typeKey === 'LOWER_UNIFORM_MISSING' ? '#f97316'
          : typeKey === 'PHYSICAL_EDUCATION_UNIFORM' ? '#4f46e5'
          : typeKey === 'CIVIL_CLOTHES' ? '#e11d48'
          : typeKey === 'INAPPROPRIATE_CLOTHING' ? '#9333ea'
          : '#475569',
      };
    });

    // Class distribution
    const classViolationsMap: Record<string, number> = {};
    const classStudentsMap: Record<string, number> = {};

    allClasses.forEach((st) => {
      const cls = `${st.sinif}-${st.sube}`;
      classStudentsMap[cls] = (classStudentsMap[cls] || 0) + 1;
    });

    weeklyViolations.forEach((v) => {
      if (v.student) {
        const cls = `${v.student.sinif}-${v.student.sube}`;
        classViolationsMap[cls] = (classViolationsMap[cls] || 0) + 1;
      }
    });

    const class_distribution = Object.keys(classStudentsMap)
      .map((cls) => ({
        class_name: cls,
        count: classViolationsMap[cls] || 0,
        student_count: classStudentsMap[cls] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Repeat offenders (>= 2 violations in current week)
    const studentWeeklyViolationsMap: Record<string, { student: any; count: number; lastViolation: any }> = {};
    weeklyViolations.forEach((v) => {
      if (v.student) {
        if (!studentWeeklyViolationsMap[v.student_id]) {
          studentWeeklyViolationsMap[v.student_id] = {
            student: v.student,
            count: 0,
            lastViolation: v,
          };
        }
        studentWeeklyViolationsMap[v.student_id].count += 1;
      }
    });

    const repeat_offenders_list = Object.values(studentWeeklyViolationsMap)
      .filter((item) => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        student: {
          ...item.student,
          created_at: item.student.created_at?.toISOString?.() || item.student.created_at,
          updated_at: item.student.updated_at?.toISOString?.() || item.student.updated_at,
        } as Student,
        weekly_count: item.count,
        total_count: item.count,
        last_violation: {
          ...item.lastViolation,
          created_at: item.lastViolation.created_at?.toISOString?.() || item.lastViolation.created_at,
          updated_at: item.lastViolation.updated_at?.toISOString?.() || item.lastViolation.updated_at,
        } as Violation,
      }));

    // Top violation class
    const top_violation_class = class_distribution[0]?.count > 0 ? class_distribution[0].class_name : 'Yok';

    // Top violation type
    let top_violation_type = 'Yok';
    let maxTypeCount = 0;
    type_distribution.forEach((td) => {
      if (td.count > maxTypeCount) {
        maxTypeCount = td.count;
        top_violation_type = td.name;
      }
    });

    const formattedRecentViolations: Violation[] = recentViolations.map((v) => ({
      ...v,
      created_at: v.created_at.toISOString(),
      updated_at: v.updated_at.toISOString(),
      student: v.student ? {
        ...v.student,
        created_at: v.student.created_at.toISOString(),
        updated_at: v.student.updated_at.toISOString(),
      } : undefined,
    }));

    return {
      today_total: todayViolations.length,
      weekly_total: weeklyViolations.length,
      top_violation_class,
      top_violation_type,
      repeat_offenders_count: repeat_offenders_list.length,
      active_teachers_today: activeTeachersToday.length,
      daily_trend,
      type_distribution,
      class_distribution: class_distribution.slice(0, 10),
      recent_violations: formattedRecentViolations,
      repeat_offenders_list,
    };
  }

  async getClassAnalytics() {
    const today = getCurrentIstanbulDate();
    const [y, m, d] = today.split('-').map(Number);
    const todayDateObj = new Date(y, m - 1, d);
    const dayOfWeek = todayDateObj.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayObj = new Date(y, m - 1, d - distanceToMonday);
    
    const formatLocal = (dt: Date) => {
      const yStr = dt.getFullYear();
      const mStr = String(dt.getMonth() + 1).padStart(2, '0');
      const dStr = String(dt.getDate()).padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    };
    const mondayStr = formatLocal(mondayObj);

    const [allStudents, allViolations] = await Promise.all([
      prisma.student.findMany({
        where: { aktif: true },
        select: { id: true, sinif: true, sube: true },
      }),
      prisma.violation.findMany({
        where: { is_cancelled: false },
        include: { student: true },
      }),
    ]);

    const classStats: Record<string, {
      sinif: string;
      sube: string;
      class_name: string;
      student_count: number;
      total_violations: number;
      weekly_violations: number;
      repeat_offenders: Set<string>;
      types: Record<string, number>;
    }> = {};

    allStudents.forEach((st) => {
      const cls = `${st.sinif}-${st.sube}`;
      if (!classStats[cls]) {
        classStats[cls] = {
          sinif: st.sinif,
          sube: st.sube,
          class_name: cls,
          student_count: 0,
          total_violations: 0,
          weekly_violations: 0,
          repeat_offenders: new Set(),
          types: {},
        };
      }
      classStats[cls].student_count += 1;
    });

    const studentWeeklyCount: Record<string, number> = {};

    allViolations.forEach((v) => {
      if (v.student) {
        const cls = `${v.student.sinif}-${v.student.sube}`;
        if (!classStats[cls]) {
          classStats[cls] = {
            sinif: v.student.sinif,
            sube: v.student.sube,
            class_name: cls,
            student_count: 0,
            total_violations: 0,
            weekly_violations: 0,
            repeat_offenders: new Set(),
            types: {},
          };
        }
        classStats[cls].total_violations += 1;
        classStats[cls].types[v.type] = (classStats[cls].types[v.type] || 0) + 1;

        if (v.date >= mondayStr && v.date <= today) {
          classStats[cls].weekly_violations += 1;
          studentWeeklyCount[v.student_id] = (studentWeeklyCount[v.student_id] || 0) + 1;
          if (studentWeeklyCount[v.student_id] >= 2) {
            classStats[cls].repeat_offenders.add(v.student_id);
          }
        }
      }
    });

    return Object.values(classStats).map((item) => {
      let mostFrequentType = '-';
      let maxCount = 0;
      Object.entries(item.types).forEach(([typeKey, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostFrequentType = VIOLATION_TYPE_MAP[typeKey]?.shortLabel || typeKey;
        }
      });

      return {
        sinif: item.sinif,
        sube: item.sube,
        class_name: item.class_name,
        student_count: item.student_count,
        total_violations: item.total_violations,
        weekly_violations: item.weekly_violations,
        violations_per_student: item.student_count > 0 ? (item.total_violations / item.student_count).toFixed(2) : '0',
        repeat_offenders_count: item.repeat_offenders.size,
        most_frequent_type: mostFrequentType,
      };
    }).sort((a, b) => b.total_violations - a.total_violations);
  }
}

export const reportRepository = new ReportRepository();
