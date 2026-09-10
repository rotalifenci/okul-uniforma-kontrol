import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTR(dateStringOrDate: string | Date | null | undefined): string {
  if (!dateStringOrDate) return "-";
  
  if (typeof dateStringOrDate === 'string' && dateStringOrDate.includes('-') && dateStringOrDate.length === 10) {
    const [year, month, day] = dateStringOrDate.split('-');
    return `${day}.${month}.${year}`;
  }

  const d = new Date(dateStringOrDate);
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}

export function formatTimeTR(timeStringOrDate: string | Date | null | undefined): string {
  if (!timeStringOrDate) return "-";
  if (typeof timeStringOrDate === 'string' && timeStringOrDate.includes(':') && timeStringOrDate.length <= 5) {
    return timeStringOrDate;
  }
  const d = new Date(timeStringOrDate);
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

export function getCurrentIstanbulDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now); // YYYY-MM-DD
}

export function getCurrentIstanbulTime(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(now); // HH:mm
}

export function getDayNameTR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[d.getDay()];
}

export function getShortDayNameTR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  return days[d.getDay()];
}

export const VIOLATION_TYPE_MAP: Record<string, { label: string; shortLabel: string; color: string; badgeColor: string; icon: string }> = {
  UPPER_UNIFORM_MISSING: {
    label: "Üst Forma Eksik",
    shortLabel: "Üst Forma",
    color: "bg-amber-500 hover:bg-amber-600 text-white",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: "Shirt"
  },
  LOWER_UNIFORM_MISSING: {
    label: "Alt Forma Eksik",
    shortLabel: "Alt Forma",
    color: "bg-orange-500 hover:bg-orange-600 text-white",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: "Scissors"
  },
  PHYSICAL_EDUCATION_UNIFORM: {
    label: "Beden Eğitimi Eşofman İhlali",
    shortLabel: "Eşofman İhlali",
    color: "bg-indigo-600 hover:bg-indigo-700 text-white",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    icon: "Activity"
  },
  CIVIL_CLOTHES: {
    label: "Tamamen Sivil / Uygunsuz",
    shortLabel: "Sivil Kıyafet",
    color: "bg-rose-600 hover:bg-rose-700 text-white",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: "UserX"
  },
  INAPPROPRIATE_CLOTHING: {
    label: "Kılık-Kıyafet Uygunsuz",
    shortLabel: "Uygunsuzluk",
    color: "bg-purple-600 hover:bg-purple-700 text-white",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    icon: "AlertCircle"
  },
  OTHER: {
    label: "Diğer İhlal",
    shortLabel: "Diğer",
    color: "bg-slate-700 hover:bg-slate-800 text-white",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    icon: "MoreHorizontal"
  }
};
