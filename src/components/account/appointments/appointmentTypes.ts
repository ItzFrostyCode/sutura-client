import { Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';

export interface MyAppointment {
  id: number;
  appointment_type: string;
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  // Not yet writable anywhere (Staff Check-In action, not built) — read-side
  // only, see docs/STAFF-WORKFLOW.md §1-2 (cross-role dependency).
  checked_in_at?: string | null;
  duration_minutes: number;
  service_name: string | null;
  payment_status: string;
  cancellation_reason: string | null;
  rebooking_blocked: boolean;
  notes?: string | null;
  store: { name: string; slug: string; logo_path: string | null } | null;
  branch: { name: string; address: string | null; city: string | null } | null;
}

export const STATUS_META: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Pending Confirmation', Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  confirmed: { label: 'Confirmed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  in_progress: { label: 'In Progress', Icon: Clock, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  completed: { label: 'Completed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  cancelled: { label: 'Cancelled', Icon: XCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  no_show: { label: 'No Show', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
};

export const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No Show' },
];

export const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation',
  measurement: 'Measurement',
  fitting: 'Fitting',
  alteration: 'Alteration',
  pickup: 'Pickup',
};

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface DayCell {
  key: string;
  num: number | null;
  isToday: boolean;
  isPast: boolean;
  count: number;
}
