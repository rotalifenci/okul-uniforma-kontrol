import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı gereklidir.'),
  password: z.string().min(1, 'Şifre gereklidir.'),
  remember_me: z.boolean().optional(),
});

export const StudentCreateSchema = z.object({
  ogrenci_no: z.string().min(1, 'Öğrenci numarası zorunludur.').regex(/^[0-9]+$/, 'Öğrenci numarası yalnızca rakamlardan oluşmalıdır.'),
  ad_soyad: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır.'),
  sinif: z.string().min(1, 'Sınıf seçimi zorunludur.'),
  sube: z.string().min(1, 'Şube seçimi zorunludur.'),
  cinsiyet: z.enum(['ERKEK', 'KIZ']).optional().nullable(),
  veli_telefon: z.string().optional().nullable(),
  profil_resmi_url: z.string().url('Geçerli bir URL giriniz.').optional().nullable().or(z.literal('')),
  aktif: z.boolean().default(true),
});

export const StudentUpdateSchema = StudentCreateSchema.partial();

export const ViolationCreateSchema = z.object({
  student_id: z.string().min(1, 'Öğrenci ID zorunludur.'),
  type: z.string().min(1, 'İhlal türü seçilmelidir.'),
  duty_teacher_name: z.string().optional().nullable(),
  duty_location: z.string().optional().nullable(),
  note: z.string().max(500, 'Not en fazla 500 karakter olabilir.').optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı (YYYY-MM-DD)').optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Geçersiz saat formatı (HH:mm)').optional(),
  client_transaction_id: z.string().optional(),
  allow_duplicate: z.boolean().optional().default(false),
});

export const UserCreateSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır.').regex(/^[a-zA-Z0-9._-]+$/, 'Geçersiz kullanıcı adı karakterleri.'),
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır.'),
  surname: z.string().min(2, 'Soyad en az 2 karakter olmalıdır.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  role: z.enum(['ADMIN', 'TEACHER']),
  active: z.boolean().default(true),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır.').optional(),
  surname: z.string().min(2, 'Soyad en az 2 karakter olmalıdır.').optional(),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'TEACHER']).optional(),
  active: z.boolean().optional(),
});

export const SystemSettingSchema = z.object({
  school_name: z.string().min(2, 'Okul adı gereklidir.'),
  school_logo_url: z.string().optional().nullable(),
  repeat_violation_threshold: z.number().min(1).max(20).default(2),
  special_followup_threshold: z.number().min(2).max(50).default(3),
  qr_validity_seconds: z.number().min(15).max(300).default(60),
  day_closure_time: z.string().optional().default('17:00'),
});
