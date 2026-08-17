import React from 'react';
import { MessageSquare, Ruler, ShirtIcon, Scissors, Package } from 'lucide-react';

export const APPOINTMENT_TYPES = ['consultation', 'measurement', 'fitting', 'alteration', 'pickup'] as const;
export type AppointmentType = typeof APPOINTMENT_TYPES[number];

/**
 * Default duration (minutes) per appointment type — the Schedule Appointment
 * form auto-calculates duration from this instead of a manual selector.
 * Mirrors Appointment::TYPE_DEFAULT_DURATIONS on the backend exactly.
 */
export const TYPE_DEFAULT_DURATIONS: Record<AppointmentType, number> = {
  consultation: 30,
  measurement: 45,
  fitting: 45,
  alteration: 30,
  pickup: 15,
};

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export const TYPES_REQUIRING_SERVICE = new Set<AppointmentType>(['measurement', 'alteration']);

export interface Appointment {
  id: number;
  appointment_type: AppointmentType;
  intake_channel?: 'walk_in' | 'online';
  customer: { id: number; name: string; email?: string; phone?: string | null };
  service: { id: number; name: string } | null;
  branch: { id: number; name: string } | null;
  scheduled_at: string;
  duration_minutes: number;
  assigned_staff_id?: number | null;
  assigned_staff?: { id?: number; name: string; user?: { name: string } } | null;
  status: AppointmentStatus;
  notes: string;
  reference_images?: string[] | null;
  reference_link?: string | null;
  shop_branch_id?: number | null;
  job_order_id?: number | null;
  job_order?: { id: number; order_number: string } | null;
  answers?: Record<string, string | number | boolean> | null;
  outcome?: 'completed' | 'rescheduled' | 'no_show' | 'converted_to_job' | 'cancelled' | null;
  priority?: 'normal' | 'urgent' | 'rush';
  garment_category?: 'barong' | 'gown' | 'suit' | 'filipiniana' | 'uniform' | 'lab_gown' | 'scrub_suit' | 'corporate_wear' | 'alteration_repair' | null;
}

export interface ServiceData  { id: number; name: string }
export interface CustomerData { id: number; name: string; phone?: string | null; email?: string }
export interface BranchData   { id: number; name: string }
export interface StaffData    { id: number; user_id: number; role?: string; additional_roles?: string[] | null; branch?: { id: number; name: string } | null; user?: { id: number; name: string } }
export interface JobOrderData { id: number; customer_id?: number; title?: string; order_number?: string; status?: string; customer?: { name: string } }

export const TYPE_CONFIG: Record<AppointmentType, {
  label: string; icon: React.ReactNode; bg: string; border: string;
  dot: string; text: string; badgeBg: string; badgeBorder: string; badgeText: string;
}> = {
  consultation: {
    label: 'Consultation', icon: <MessageSquare size={13} />,
    bg: 'bg-purple-50/80', border: 'border-purple-200/80', dot: 'bg-purple-600',
    text: 'text-purple-900', badgeBg: 'bg-purple-50', badgeBorder: 'border-purple-200', badgeText: 'text-purple-800',
  },
  measurement: {
    label: 'Measurement', icon: <Ruler size={13} />,
    bg: 'bg-sky-50/80', border: 'border-sky-200/80', dot: 'bg-sky-600',
    text: 'text-sky-900', badgeBg: 'bg-sky-50', badgeBorder: 'border-sky-200', badgeText: 'text-sky-800',
  },
  fitting: {
    label: 'Fitting', icon: <ShirtIcon size={13} />,
    bg: 'bg-amber-50/80', border: 'border-amber-200/80', dot: 'bg-amber-600',
    text: 'text-amber-900', badgeBg: 'bg-amber-50', badgeBorder: 'border-amber-200', badgeText: 'text-amber-800',
  },
  alteration: {
    label: 'Alteration', icon: <Scissors size={13} />,
    bg: 'bg-indigo-50/80', border: 'border-indigo-200/80', dot: 'bg-indigo-600',
    text: 'text-indigo-900', badgeBg: 'bg-indigo-50', badgeBorder: 'border-indigo-200', badgeText: 'text-indigo-800',
  },
  pickup: {
    label: 'Pickup', icon: <Package size={13} />,
    bg: 'bg-emerald-50/80', border: 'border-emerald-200/80', dot: 'bg-emerald-600',
    text: 'text-emerald-900', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', badgeText: 'text-emerald-800',
  },
};

export const STATUS_CONFIG: Record<AppointmentStatus, {
  label: string; dot: string; badge: string; opacity: string; borderStyle: string;
}> = {
  pending:     { label: 'Pending Review', dot: 'bg-amber-500', badge: 'bg-amber-50/70 text-amber-900 border-amber-200', opacity: 'opacity-90', borderStyle: 'border-dashed' },
  confirmed:   { label: 'Confirmed',      dot: 'bg-blue-600', badge: 'bg-blue-50/80 text-blue-900 border-blue-200', opacity: 'opacity-100', borderStyle: 'border-solid' },
  in_progress: { label: 'In Progress',    dot: 'bg-taupe', badge: 'bg-taupe/10 text-taupe border-taupe/30', opacity: 'opacity-100', borderStyle: 'border-solid' },
  completed:   { label: 'Completed',      dot: 'bg-emerald-600', badge: 'bg-emerald-50/80 text-emerald-900 border-emerald-200', opacity: 'opacity-70', borderStyle: 'border-solid' },
  cancelled:   { label: 'Cancelled',      dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', opacity: 'opacity-50', borderStyle: 'border-solid' },
  no_show:     { label: 'No Show',        dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-600 border-stone-200', opacity: 'opacity-50', borderStyle: 'border-solid' },
};

export function TypeBadge({ type }: { readonly type: AppointmentType }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.consultation;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border tracking-tight ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}>
      {cfg.icon} <span>{cfg.label}</span>
    </span>
  );
}

export function StatusBadge({ status }: { readonly status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span>{cfg.label}</span>
    </span>
  );
}

/**
 * Returns a local YYYY-MM-DD string without UTC timezone drift
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatScheduled(iso: string) {
  const formattedStr = iso.includes('T') ? iso : iso.replace(' ', 'T');
  const d = new Date(formattedStr);

  const now = new Date();
  const todayStr = getLocalDateString(now);
  const targetStr = getLocalDateString(d);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let relative = '';
  if (targetStr === todayStr) relative = 'Today';
  else if (targetStr === tomorrowStr) relative = 'Tomorrow';
  else if (targetStr === yesterdayStr) relative = 'Yesterday';
  else {
    const diffDays = Math.round((new Date(targetStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1 && diffDays <= 7) relative = `In ${diffDays} days`;
  }

  return {
    date: d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    shortDate: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }),
    relative,
    rawDate: targetStr,
    isToday: targetStr === todayStr,
  };
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) {
      return res.data.message;
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function getCustomerInitials(name?: string): string {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts.at(-1)?.[0] ?? '')).toUpperCase();
}
