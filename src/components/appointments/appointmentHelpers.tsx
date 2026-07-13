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
  customer: { id: number; name: string; email: string };
  service: { id: number; name: string } | null;
  branch: { id: number; name: string } | null;
  scheduled_at: string;
  duration_minutes: number;
  assigned_staff_id?: number | null;
  assigned_staff?: { name: string } | null;
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
  garment_category?: 'barong' | 'gown' | 'suit' | 'filipiniana' | 'uniform' | null;
}

export interface ServiceData  { id: number; name: string }
export interface CustomerData { id: number; name: string }
export interface BranchData   { id: number; name: string }
export interface StaffData    { id: number; user_id: number; role?: string; additional_roles?: string[] | null; user?: { id: number; name: string } }
export interface JobOrderData { id: number; customer_id?: number; title?: string; order_number?: string; status?: string; customer?: { name: string } }

export const TYPE_CONFIG: Record<AppointmentType, {
  label: string; icon: React.ReactNode; bg: string; border: string;
  dot: string; text: string; badgeBg: string; badgeBorder: string; badgeText: string;
}> = {
  consultation: {
    label: 'Consultation', icon: <MessageSquare size={12} />,
    bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500',
    text: 'text-purple-900', badgeBg: 'bg-purple-50', badgeBorder: 'border-purple-200', badgeText: 'text-purple-700',
  },
  measurement: {
    label: 'Measurement', icon: <Ruler size={12} />,
    bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500',
    text: 'text-blue-900', badgeBg: 'bg-blue-50', badgeBorder: 'border-blue-200', badgeText: 'text-blue-700',
  },
  fitting: {
    label: 'Fitting', icon: <ShirtIcon size={12} />,
    bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500',
    text: 'text-orange-900', badgeBg: 'bg-orange-50', badgeBorder: 'border-orange-200', badgeText: 'text-orange-700',
  },
  alteration: {
    label: 'Alteration', icon: <Scissors size={12} />,
    bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-400',
    text: 'text-yellow-900', badgeBg: 'bg-yellow-50', badgeBorder: 'border-yellow-200', badgeText: 'text-yellow-700',
  },
  pickup: {
    label: 'Pickup', icon: <Package size={12} />,
    bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500',
    text: 'text-emerald-900', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', badgeText: 'text-emerald-700',
  },
};

export const STATUS_CONFIG: Record<AppointmentStatus, {
  label: string; dot: string; badge: string; opacity: string; borderStyle: string;
}> = {
  pending:     { label: 'Pending',     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',    opacity: 'opacity-70',  borderStyle: 'border-dashed' },
  confirmed:   { label: 'Confirmed',   dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200',       opacity: 'opacity-100', borderStyle: 'border-solid' },
  in_progress: { label: 'In Progress', dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-200', opacity: 'opacity-100', borderStyle: 'border-solid' },
  completed:   { label: 'Completed',   dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', opacity: 'opacity-50', borderStyle: 'border-solid' },
  cancelled:   { label: 'Cancelled',   dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200',       opacity: 'opacity-40',  borderStyle: 'border-solid' },
  no_show:     { label: 'No Show',     dot: 'bg-gray-500',    badge: 'bg-gray-100 text-gray-600 border-gray-200',      opacity: 'opacity-40',  borderStyle: 'border-solid' },
};

export function TypeBadge({ type }: { readonly type: AppointmentType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { readonly status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function formatScheduled(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
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
