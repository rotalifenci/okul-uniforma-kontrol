import { describe, it, expect } from 'vitest';
import { StudentCreateSchema } from '@/schemas';

describe('CSV & Student Validation Schemas', () => {
  it('should validate valid student data', () => {
    const valid = {
      ogrenci_no: '1005',
      ad_soyad: 'Zeynep Kaya',
      sinif: '9',
      sube: 'A',
      cinsiyet: 'KIZ',
      veli_telefon: '05321234567',
    };
    const result = StudentCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject non-numeric student numbers', () => {
    const invalid = {
      ogrenci_no: 'ABC105',
      ad_soyad: 'Ahmet Demir',
      sinif: '9',
      sube: 'A',
    };
    const result = StudentCreateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject too short ad_soyad', () => {
    const invalid = {
      ogrenci_no: '1006',
      ad_soyad: 'A',
      sinif: '9',
      sube: 'A',
    };
    const result = StudentCreateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
