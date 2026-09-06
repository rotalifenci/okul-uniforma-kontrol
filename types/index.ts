export type UserRole = 'ADMIN' | 'TEACHER';

export interface User {
  id: string;
  username: string;
  name: string;
  surname: string;
  role: UserRole;
  active: boolean;
  last_login_at?: string | Date | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Student {
  id: string;
  ogrenci_no: string;
  ad_soyad: string;
  sinif: string;
  sube: string;
  cinsiyet?: string | null;
  veli_telefon?: string | null;
  profil_resmi_url?: string | null;
  aktif: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
  // Computed fields
  violations_count?: number;
  weekly_violations_count?: number;
  today_violations_count?: number;
  last_violation_date?: string | null;
  is_repeat_offender?: boolean;
}

export type ViolationTypeCode =
  | 'UPPER_UNIFORM_MISSING'
  | 'LOWER_UNIFORM_MISSING'
  | 'CIVIL_CLOTHES'
  | 'INAPPROPRIATE_CLOTHING'
  | 'OTHER';

export interface Violation {
  id: string;
  student_id: string;
  teacher_id: string;
  duty_teacher_name?: string | null;
  duty_location?: string | null;
  type: ViolationTypeCode | string;
  note?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  client_transaction_id?: string | null;
  is_cancelled?: boolean;
  cancelled_reason?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  student?: Student;
  teacher?: {
    id: string;
    username: string;
    name: string;
    surname: string;
  };
}

export interface ViolationType {
  id: string;
  code: string;
  name: string;
  color: string;
  icon?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string | Date;
  user?: {
    id: string;
    username: string;
    name: string;
    surname: string;
    role: string;
  } | null;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string | null;
  error?: {
    code: string;
    details?: any;
  } | null;
}

export interface DashboardStats {
  today_total: number;
  weekly_total: number;
  top_violation_class: string;
  top_violation_type: string;
  repeat_offenders_count: number;
  active_teachers_today: number;
  daily_trend: {
    day_name: string;
    date: string;
    count: number;
  }[];
  type_distribution: {
    type: string;
    name: string;
    count: number;
    color: string;
  }[];
  class_distribution: {
    class_name: string;
    count: number;
    student_count: number;
  }[];
  recent_violations: Violation[];
  repeat_offenders_list: {
    student: Student;
    weekly_count: number;
    total_count: number;
    last_violation: Violation;
  }[];
}

export interface PendingSyncViolation {
  client_transaction_id: string;
  student_id: string;
  student_no: string;
  student_name: string;
  type: string;
  note?: string;
  date: string;
  time: string;
  created_at: number;
  status: 'pending' | 'syncing' | 'failed';
  error_message?: string;
}
