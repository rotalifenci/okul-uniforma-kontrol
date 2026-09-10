import { describe, it, expect } from 'vitest';
import prisma from '@/lib/prisma';
import { reportRepository } from '@/repositories/report.repository';
import { violationRepository } from '@/repositories/violation.repository';

describe('Repeat Violation & Duplicate Logic', () => {
  it('should detect duplicate violation on same day unless allow_duplicate is true', async () => {
    // Get existing student & teacher from seed
    const student = await prisma.student.findFirst();
    const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });

    expect(student).not.toBeNull();
    expect(teacher).not.toBeNull();

    if (student && teacher) {
      const testDate = '2026-12-31';

      // 1. First record
      const res = await violationRepository.createViolation({
        student_id: student.id,
        teacher_id: teacher.id,
        type: 'UPPER_UNIFORM_MISSING',
        date: testDate,
        allow_duplicate: false,
      });

      expect(res.violation).not.toBeNull();
      expect(res.duplicate).toBe(false);

      // 2. Second record on same day with allow_duplicate: false -> Should be flagged as duplicate
      const secondAttempt = await violationRepository.createViolation({
        student_id: student.id,
        teacher_id: teacher.id,
        type: 'UPPER_UNIFORM_MISSING',
        date: testDate,
        allow_duplicate: false,
      });

      expect(secondAttempt.duplicate).toBe(true);
      expect(secondAttempt.message).toContain('zaten kaydedilmiş');

      // 3. Third record with allow_duplicate: true -> Should succeed
      const allowedAttempt = await violationRepository.createViolation({
        student_id: student.id,
        teacher_id: teacher.id,
        type: 'UPPER_UNIFORM_MISSING',
        date: testDate,
        allow_duplicate: true,
      });

      expect(allowedAttempt.duplicate).toBe(false);
      expect(allowedAttempt.violation).not.toBeNull();

      // Clean up test records
      if (res.violation?.id) await violationRepository.deleteViolation(res.violation.id);
      if (allowedAttempt.violation?.id) await violationRepository.deleteViolation(allowedAttempt.violation.id);
    }
  });

  it('should calculate repeat offenders in dashboard stats', async () => {
    const stats = await reportRepository.getDashboardStats();
    expect(stats).toBeDefined();
    expect(typeof stats.today_total).toBe('number');
    expect(typeof stats.weekly_total).toBe('number');
    expect(Array.isArray(stats.repeat_offenders_list)).toBe(true);
    expect(Array.isArray(stats.daily_trend)).toBe(true);
    expect(stats.daily_trend.length).toBe(7); // Mon-Sun (Full week)
  });
});
