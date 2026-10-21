import { Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';

export interface MyJobOrder { id: number; order_number: string; status: string; tracking_code: string | null }

export interface MyAppointment {
  id: number;
  appointment_type: string;
  // Service, Shop, or Production (made by the shop's job order). Older rows may not have it.
  kind?: 'service' | 'shop' | 'production';
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  // Not yet writable anywhere (Staff Check-In action, not built) — read-side
  // only, see docs/STAFF-WORKFLOW.md §1-2 (cross-role dependency).
  checked_in_at?: string | null;
  duration_minutes: number;
  service_name: string | null;
  service?: { id: number; name: string; service_category?: string | null } | null;
  // The catalog design this was booked from, with the size/color picked on its page.
  catalog_item?: {
    id: number;
    name: string;
    garment_type?: string | null;
  } | null;
  selected_size?: string | null;
  selected_color?: string | null;
  // A walk-in took this request's slot; the customer must pick another time.
  needs_new_time?: boolean;
  /** The order made from this visit, or the order a fitting belongs to. */
  job_order?: MyJobOrder | null;
  /** Where it was before it was moved. */
  previous_scheduled_at?: string | null;
  material_source?: 'shop' | 'own' | null;
  payment_status: string;
  cancellation_reason: string | null;
  purpose_label?: string | null;
  rejection_reason?: string | null;
  rejection_note?: string | null;
  rebooking_blocked: boolean;
  notes?: string | null;
  store: { name: string; slug: string; logo_path: string | null } | null;
  branch: { name: string; address: string | null; city: string | null } | null;
}

export const STATUS_META: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Waiting for the shop', Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  confirmed: { label: 'Approved', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  in_progress: { label: 'In progress', Icon: Clock, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  completed: { label: 'Done', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  cancelled: { label: 'Cancelled', Icon: XCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  rejected: { label: 'Declined', Icon: XCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  no_show: { label: 'Missed', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
};

/**
 * What a status means to the customer. A fitting the shop's order made was never requested: it is not "pending confirmation",
 * the shop is fixing its time. A finished visit says how it ended: with an order, or as a consultation only.
 */
export function statusMetaFor(appt: Pick<MyAppointment, 'status' | 'kind' | 'job_order'> & { appointment_type?: string }): { label: string; Icon: typeof Clock; tone: string } {
  const base = STATUS_META[appt.status] ?? STATUS_META.pending;
  if (appt.kind === 'production') {
    if (appt.status === 'pending') return { ...base, label: 'Shop is setting the time' };
    if (appt.status === 'confirmed') return { ...base, label: 'Time confirmed' };
  }
  if (appt.status === 'completed' && appt.kind !== 'production') {
    return { ...base, label: appt.job_order ? 'Order made' : appt.appointment_type === 'consultation' ? 'Consultation done' : 'Done' };
  }
  return base;
}

export const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Waiting' },
  { key: 'confirmed', label: 'Approved' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Declined' },
  { key: 'no_show', label: 'Missed' },
];

// A fitting or pick-up belongs to the customer's order; the other two are what they asked for.
export const KIND_LABELS: Record<string, string> = { service: 'Service', shop: 'General visit', production: 'For your order' };

export const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation',
  measurement: 'Measurement',
  fitting: 'Fitting',
  alteration: 'Alteration',
  pickup: 'Pickup',
  other: 'Other',
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
