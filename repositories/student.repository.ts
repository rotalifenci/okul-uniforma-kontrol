import prisma from '@/lib/prisma';
import { getCurrentIstanbulDate } from '@/lib/utils';
import { Student } from '@/types';

export class StudentRepository {
  /**
   * Fast student search by query (number or name) or class
   */
  async searchStudents({
    query = '',
    sinif,
    sube,
    activeOnly = true,
    limit = 20,
  }: {
    query?: string;
    sinif?: string;
    sube?: string;
    activeOnly?: boolean;
    limit?: number;
  }): Promise<Student[]> {
    const trimmed = query.trim();
    const isNumeric = /^\d+$/.test(trimmed);

    const where: any = {};
    if (activeOnly) {
      where.aktif = true;
    }
    if (sinif) {
      where.sinif = sinif;
    }
    if (sube) {
      where.sube = sube;
    }

    if (trimmed) {
      if (isNumeric) {
        where.ogrenci_no = {
          startsWith: trimmed,
        };
      } else {
        where.ad_soyad = {
          contains: trimmed,
        };
      }
    }

    const students = await prisma.student.findMany({
      where,
      take: limit,
      orderBy: isNumeric ? { ogrenci_no: 'asc' } : { ad_soyad: 'asc' },
      include: {
        violations: {
          where: { is_cancelled: false },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    const today = getCurrentIstanbulDate();
    const todayDateObj = new Date(today);
    const dayOfWeek = todayDateObj.getDay(); // 0 = Sun, 1 = Mon ...
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayObj = new Date(todayDateObj);
    mondayObj.setDate(todayDateObj.getDate() - distanceToMonday);
    const mondayStr = mondayObj.toISOString().split('T')[0];

    return students.map((s) => {
      const allViolations = s.violations || [];
      const weeklyViolations = allViolations.filter((v) => v.date >= mondayStr && v.date <= today);
      const todayViolations = allViolations.filter((v) => v.date === today);

      return {
        id: s.id,
        ogrenci_no: s.ogrenci_no,
        ad_soyad: s.ad_soyad,
        sinif: s.sinif,
        sube: s.sube,
        cinsiyet: s.cinsiyet,
        veli_telefon: s.veli_telefon,
        profil_resmi_url: s.profil_resmi_url,
        aktif: s.aktif,
        created_at: s.created_at.toISOString(),
        updated_at: s.updated_at.toISOString(),
        violations_count: allViolations.length,
        weekly_violations_count: weeklyViolations.length,
        today_violations_count: todayViolations.length,
        last_violation_date: allViolations[0]?.date || null,
        is_repeat_offender: weeklyViolations.length >= 2,
      };
    });
  }

  async findByOgrenciNo(ogrenci_no: string): Promise<Student | null> {
    const s = await prisma.student.findUnique({
      where: { ogrenci_no },
      include: {
        violations: {
          where: { is_cancelled: false },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!s) return null;

    const today = getCurrentIstanbulDate();
    const todayDateObj = new Date(today);
    const dayOfWeek = todayDateObj.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayObj = new Date(todayDateObj);
    mondayObj.setDate(todayDateObj.getDate() - distanceToMonday);
    const mondayStr = mondayObj.toISOString().split('T')[0];

    const weeklyViolations = s.violations.filter((v) => v.date >= mondayStr && v.date <= today);
    const todayViolations = s.violations.filter((v) => v.date === today);

    return {
      id: s.id,
      ogrenci_no: s.ogrenci_no,
      ad_soyad: s.ad_soyad,
      sinif: s.sinif,
      sube: s.sube,
      cinsiyet: s.cinsiyet,
      veli_telefon: s.veli_telefon,
      profil_resmi_url: s.profil_resmi_url,
      aktif: s.aktif,
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
      violations_count: s.violations.length,
      weekly_violations_count: weeklyViolations.length,
      today_violations_count: todayViolations.length,
      last_violation_date: s.violations[0]?.date || null,
      is_repeat_offender: weeklyViolations.length >= 2,
    };
  }

  async findById(id: string): Promise<Student | null> {
    const s = await prisma.student.findUnique({
      where: { id },
      include: {
        violations: {
          where: { is_cancelled: false },
          include: {
            teacher: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!s) return null;

    const today = getCurrentIstanbulDate();
    const todayDateObj = new Date(today);
    const dayOfWeek = todayDateObj.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const mondayObj = new Date(todayDateObj);
    mondayObj.setDate(todayDateObj.getDate() - distanceToMonday);
    const mondayStr = mondayObj.toISOString().split('T')[0];

    const weeklyViolations = s.violations.filter((v) => v.date >= mondayStr && v.date <= today);
    const todayViolations = s.violations.filter((v) => v.date === today);

    return {
      id: s.id,
      ogrenci_no: s.ogrenci_no,
      ad_soyad: s.ad_soyad,
      sinif: s.sinif,
      sube: s.sube,
      cinsiyet: s.cinsiyet,
      veli_telefon: s.veli_telefon,
      profil_resmi_url: s.profil_resmi_url,
      aktif: s.aktif,
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
      violations_count: s.violations.length,
      weekly_violations_count: weeklyViolations.length,
      today_violations_count: todayViolations.length,
      last_violation_date: s.violations[0]?.date || null,
      is_repeat_offender: weeklyViolations.length >= 2,
    };
  }

  async getAllPaginated({
    page = 1,
    limit = 25,
    search = '',
    sinif,
    sube,
    aktif,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    sinif?: string;
    sube?: string;
    aktif?: boolean;
  }) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (typeof aktif === 'boolean') {
      where.aktif = aktif;
    }
    if (sinif) where.sinif = sinif;
    if (sube) where.sube = sube;

    if (search) {
      where.OR = [
        { ogrenci_no: { contains: search } },
        { ad_soyad: { contains: search } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sinif: 'asc' }, { sube: 'asc' }, { ogrenci_no: 'asc' }],
        include: {
          _count: {
            select: { violations: { where: { is_cancelled: false } } },
          },
        },
      }),
    ]);

    return {
      items: students.map((s) => ({
        ...s,
        created_at: s.created_at.toISOString(),
        updated_at: s.updated_at.toISOString(),
        violations_count: s._count.violations,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: {
    ogrenci_no: string;
    ad_soyad: string;
    sinif: string;
    sube: string;
    cinsiyet?: string | null;
    veli_telefon?: string | null;
    profil_resmi_url?: string | null;
    aktif?: boolean;
  }) {
    return prisma.student.create({
      data: {
        ogrenci_no: data.ogrenci_no,
        ad_soyad: data.ad_soyad,
        sinif: data.sinif,
        sube: data.sube,
        cinsiyet: data.cinsiyet,
        veli_telefon: data.veli_telefon,
        profil_resmi_url: data.profil_resmi_url,
        aktif: data.aktif !== undefined ? data.aktif : true,
      },
    });
  }

  async update(id: string, data: Partial<Student>) {
    return prisma.student.update({
      where: { id },
      data: {
        ogrenci_no: data.ogrenci_no,
        ad_soyad: data.ad_soyad,
        sinif: data.sinif,
        sube: data.sube,
        cinsiyet: data.cinsiyet,
        veli_telefon: data.veli_telefon,
        profil_resmi_url: data.profil_resmi_url,
        aktif: data.aktif,
      },
    });
  }

  async toggleActive(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new Error('Öğrenci bulunamadı.');
    return prisma.student.update({
      where: { id },
      data: { aktif: !student.aktif },
    });
  }

  async getDistinctClasses() {
    const classes = await prisma.student.findMany({
      select: { sinif: true, sube: true },
      distinct: ['sinif', 'sube'],
      orderBy: [{ sinif: 'asc' }, { sube: 'asc' }],
    });
    return classes;
  }
}

export const studentRepository = new StudentRepository();
