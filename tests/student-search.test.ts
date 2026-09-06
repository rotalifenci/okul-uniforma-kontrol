import { describe, it, expect } from 'vitest';
import { studentRepository } from '@/repositories/student.repository';

describe('Student Search & Repository', () => {
  it('should find student by exact student number from 8A sınıfı.xlsx', async () => {
    const student = await studentRepository.findByOgrenciNo('1');
    expect(student).not.toBeNull();
    expect(student?.ogrenci_no).toBe('1');
    expect(student?.ad_soyad).toBe('Ahmet Yılmaz');
    expect(student?.sinif).toBe('8');
    expect(student?.sube).toBe('A');
  });

  it('should return null for non-existing student number', async () => {
    const student = await studentRepository.findByOgrenciNo('999999');
    expect(student).toBeNull();
  });

  it('should search students by prefix or substring', async () => {
    const results = await studentRepository.searchStudents({ query: '60' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => {
      expect(s.ogrenci_no.startsWith('60') || s.ad_soyad.includes('60')).toBe(true);
    });
  });

  it('should filter students by class', async () => {
    const results = await studentRepository.searchStudents({ sinif: '8' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((s) => {
      expect(s.sinif).toBe('8');
    });
  });
});
