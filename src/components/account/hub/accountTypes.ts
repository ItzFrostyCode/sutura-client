import {
  Clock, CheckCircle2, XCircle, Ban,
  Hammer, PackageCheck, Flag,
  Calendar as CalendarIcon, Ruler,
  ClipboardList, Star, History, LifeBuoy, Settings,
} from 'lucide-react';

export interface MyOrder {
  id: number;
  status: string;
}

export interface MyAppointment {
  id: number;
  appointment_type: string;
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  service_name: string | null;
  cancellation_reason: string | null;
  rebooking_blocked: boolean;
  store: { name: string; slug: string; logo_path: string | null } | null;
  branch: { name: string } | null;
}

// Matches Appointment::STATUSES exactly.
export const STATUS_META: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Pending Confirmation', Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  confirmed: { label: 'Confirmed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  in_progress: { label: 'In Progress', Icon: Clock, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  completed: { label: 'Completed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  cancelled: { label: 'Cancelled', Icon: XCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  no_show: { label: 'No Show', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
};

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

export const IN_PRODUCTION = new Set([
  'pending', 'design', 'pattern_making', 'mass_cutting_printing', 'cutting',
  'sewing', 'ready_for_fitting', 'final_adjustments', 'qc_ironing', 'on_hold',
]);

export const GUEST_MENU_ITEMS = [
  { label: 'Job Orders', Icon: ClipboardList },
  { label: 'My Appointments', Icon: CalendarIcon },
  { label: 'My Measurements', Icon: Ruler },
  { label: 'My Ratings', Icon: Star },
  { label: 'Recently Viewed', Icon: History },
  { label: 'Support Ticket', Icon: LifeBuoy },
  { label: 'Settings', Icon: Settings },
];

export interface CalendarCell {
  key: string;
  num: number | null;
  isToday: boolean;
  isPast: boolean;
  hasAppt: boolean;
}
