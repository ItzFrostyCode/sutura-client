import React from 'react';
import { isWalkInEmail } from '@/components/customers/customerHelpers';
import { MessageSquare, Ruler, ShirtIcon, Scissors, Package, Globe, Store, RefreshCw } from 'lucide-react';

export const APPOINTMENT_TYPES = ['consultation', 'measurement', 'fitting', 'alteration', 'pickup', 'other'] as const;
export type AppointmentType = typeof APPOINTMENT_TYPES[number];

/** What a person can book or type in. Fitting and pickup only exist as system-made `production` visits. */
export const BOOKABLE_TYPES = ['consultation', 'measurement', 'alteration', 'other'] as const;
/** Service (for a service or design), Shop (a general visit), Production (made by a job order). */
/** Service (for a specific service or design), Shop (a general visit), Production (made by a job order). */
export type AppointmentKind = 'service' | 'shop' | 'production';
export const KIND_LABELS: Record<AppointmentKind, string> = {
  service: 'Specific Service',
  shop: 'General Visit',
  production: 'Order Visit',
};

/**
 * Default duration (minutes) per appointment type — the Schedule Appointment
 * form auto-calculates duration from this instead of a manual selector.
 * Mirrors Appointment::TYPE_DEFAULT_DURATIONS on the backend exactly.
 */
export const TYPE_DEFAULT_DURATIONS: Record<AppointmentType, number> = {
  consultation: 30,
  measurement: 60,
  fitting: 60,
  alteration: 30,
  pickup: 30,
  other: 30,
};

/** Why a shop may decline a pending request — mirrors Appointment::REJECTION_REASONS on the server. */
export const REJECTION_REASONS: { code: string; label: string; requiresService?: boolean }[] = [
  { code: 'schedule_unavailable', label: 'Schedule unavailable' },
  { code: 'staff_unavailable', label: 'Staff / tailor unavailable' },
  { code: 'service_unavailable', label: 'Service temporarily unavailable', requiresService: true },
  { code: 'capacity_reached', label: 'Shop capacity reached for this day' },
  { code: 'cannot_accommodate', label: 'Request cannot be accommodated' },
  { code: 'other', label: 'Other reason' },
];

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rejected';

export const TYPES_REQUIRING_SERVICE = new Set<AppointmentType>(['measurement', 'alteration']);

export interface Appointment {
  id: number;
  appointment_type: AppointmentType;
  kind?: AppointmentKind;
  intake_channel?: 'walk_in' | 'online';
  customer: { id: number; name: string; email?: string; phone?: string | null; suki_tag?: boolean | null };
  service: {
    id: number;
    name: string;
    service_category?: string | null;
    base_price?: number | string | null;
  } | null;
  // The catalog design this booking was made from (its page's "Book an
  // Appointment" button), with the size/color picked there.
  catalog_item?: {
    id: number;
    name: string;
    garment_type?: string | null;
  } | null;
  selected_size?: string | null;
  selected_color?: string | null;
  purpose_label?: string | null;
  rejection_reason_code?: string | null;
  rejection_note?: string | null;
  cancellation_reason?: string | null;
  branch: { id: number; name: string } | null;
  scheduled_at: string;
  duration_minutes: number;
  assigned_staff_id?: number | null;
  assigned_staff?: { id?: number; name: string; user?: { name: string } } | null;
  status: AppointmentStatus;
  // Staff Check-In action — On Time/Late is DERIVED from this vs
  // scheduled_at, never its own stored status. See OnTimeLateBadge below.
  checked_in_at?: string | null;
  // Early-Arrival Accommodation workflow — scheduled_at is never rewritten
  // when a customer arrives early/late; these record what actually
  // happened alongside it. arrival_status is auto-derived server-side from
  // checked_in_at vs scheduled_at (never client-submitted).
  arrival_status?: 'on_time' | 'early' | 'late' | 'no_show' | null;
  early_arrival_decision?: 'waiting' | 'accommodated' | 'declined' | null;
  actual_service_start_at?: string | null;
  notes: string;
  /** What the shop wrote about the visit (shop only): written during the consultation and carried onto the order. */
  visit_notes?: string | null;
  /** Where the design comes from, a link to the customer's file, and how many people the order is for. */
  design_source?: import('@/lib/designSource').DesignSource | null;
  design_link?: string | null;
  people_count?: number | null;
  /** How many pieces in all (the people, or more than one piece each). */
  pieces_count?: number | null;
  service_id?: number | null;
  catalog_item_id?: number | null;
  /** The time it was moved from, when it was moved. */
  previous_scheduled_at?: string | null;
  reference_images?: string[] | null;
  reference_link?: string | null;
  store_branch_id?: number | null;
  job_order_id?: number | null;
  job_order?: { id: number; order_number: string; status?: string } | null;
  answers?: Record<string, string | number | boolean> | null;
  /** Whose fabric: the shop's or the customer's own (with a short note). */
  material_source?: 'shop' | 'own' | null;
  material_note?: string | null;
  outcome?: 'completed' | 'rescheduled' | 'no_show' | 'converted_to_job' | 'cancelled' | 'no_order' | null;
  /** The booking deposit: how it was paid and whether the shop has confirmed it ('pending' | 'paid' | 'rejected'). No amount is stored. */
  payment_method?: string | null;
  payment_status?: 'pending' | 'paid' | 'rejected' | null;
  priority?: 'normal' | 'urgent' | 'rush';
  garment_category?: 'barong' | 'gown' | 'suit' | 'filipiniana' | 'uniform' | 'lab_gown' | 'scrub_suit' | 'corporate_wear' | 'alteration_repair' | null;
  fitting_notes?: string | null;
  items?: AppointmentItemData[] | null;
}

export interface AppointmentItemData {
  id: number;
  appointment_id: number;
  service_id?: number | null;
  catalog_item_id?: number | null;
  item_name: string;
  quantity: number;
  unit_price?: number | null;
  selected_size?: string | null;
  selected_color?: string | null;
  add_ons?: string[] | null;
  notes?: string | null;
  service?: {
    id: number;
    name: string;
    service_category?: string | null;
    base_price?: number | string | null;
  } | null;
  catalog_item?: {
    id: number;
    name: string;
    garment_type?: string | null;
    price?: number | string | null;
  } | null;
}

export interface ServiceData  { id: number; name: string; service_category?: string | null; image_url?: string | null; base_price?: string | number | null; reviews_avg_rating?: number | null; reviews_count?: number | null }
export interface CustomerData { id: number; name: string; phone?: string | null; email?: string; profile_picture?: string | null }
export interface BranchData   { id: number; name: string }
export interface StaffData    { id: number; user_id: number; role?: string; additional_roles?: string[] | null; store_branch_id?: number | null; is_branch_manager?: boolean; branch?: { id: number; name: string } | null; user?: { id: number; name: string } }
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
  other: {
    label: 'Other', icon: <MessageSquare size={13} />,
    bg: 'bg-stone-50/80', border: 'border-stone-200/80', dot: 'bg-stone-500',
    text: 'text-stone-900', badgeBg: 'bg-stone-50', badgeBorder: 'border-stone-200', badgeText: 'text-stone-800',
  },
};

export const STATUS_CONFIG: Record<AppointmentStatus, {
  label: string; dot: string; badge: string; opacity: string; borderStyle: string;
}> = {
  pending:     { label: 'Waiting for approval', dot: 'bg-amber-500', badge: 'bg-amber-50/70 text-amber-900 border-amber-200', opacity: 'opacity-90', borderStyle: 'border-dashed' },
  confirmed:   { label: 'Approved',       dot: 'bg-blue-600', badge: 'bg-blue-50/80 text-blue-900 border-blue-200', opacity: 'opacity-100', borderStyle: 'border-solid' },
  in_progress: { label: 'In progress',    dot: 'bg-espresso', badge: 'bg-taupe/10 text-taupe border-taupe/30', opacity: 'opacity-100', borderStyle: 'border-solid' },
  completed:   { label: 'Done',           dot: 'bg-emerald-600', badge: 'bg-emerald-50/80 text-emerald-900 border-emerald-200', opacity: 'opacity-70', borderStyle: 'border-solid' },
  cancelled:   { label: 'Cancelled',      dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', opacity: 'opacity-50', borderStyle: 'border-solid' },
  rejected:    { label: 'Declined',       dot: 'bg-rose-700', badge: 'bg-rose-50 text-rose-800 border-rose-300', opacity: 'opacity-60', borderStyle: 'border-solid' },
  no_show:     { label: 'No-show',        dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-600 border-stone-200', opacity: 'opacity-50', borderStyle: 'border-solid' },
};

export function TypeBadge({ type, label, kind }: { readonly type: AppointmentType; readonly label?: string | null; readonly kind?: AppointmentKind }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.consultation;
  let text = cfg.label;
  if (type === 'other' && label) {
    text = `Other — ${label}`;
  } else if (type === 'alteration' && label) {
    text = `Alteration · ${label}`;
  } else if (kind === 'production') {
    // Made by a job order (a fitting or a pick-up), not booked by anyone.
    text = `Job order · ${cfg.label}`;
  }
  // A consultation is a consultation: what it is about (a service and design, or just a general visit) is shown on its own line.
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border tracking-tight ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}>
      {cfg.icon} <span>{text}</span>
    </span>
  );
}

/**
 * `scheduledAt` is optional and additive: when given, a pending/confirmed
 * appointment whose time has already passed renders as "Overdue" instead
 * of its normal status — nothing here auto-transitions the real status
 * (that's a business-rule decision — grace period, auto-no-show policy —
 * this owner hasn't made), it just makes an appointment that's silently
 * sitting unresolved actually visible in a scan of the list/calendar.
 */
export function StatusBadge({ status, scheduledAt, outcome, jobOrderId, jobStatus, kind, type }: { readonly status: AppointmentStatus; readonly scheduledAt?: string; readonly outcome?: Appointment['outcome']; readonly jobOrderId?: number | null; readonly jobStatus?: string | null; readonly kind?: AppointmentKind; readonly type?: AppointmentType }) {
  // A walk-in took this request's slot: it is still pending, but the customer has to pick another time.
  if (status === 'pending' && outcome === 'rescheduled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 bg-amber-50 text-amber-800 border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>Needs new time</span>
      </span>
    );
  }

  const isOverdue = (status === 'pending' || status === 'confirmed') && !!scheduledAt && new Date(scheduledAt) < new Date();

  if (isOverdue) {
    // Says what went wrong: a request nobody answered before its time, or an approved visit the customer has not come to.
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 bg-rose-50 text-rose-700 border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>{status === 'pending' ? 'Not answered' : 'Not arrived'}</span>
      </span>
    );
  }

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  // "Done" says how the visit ended: with a job order, or as a consultation only.
  const label = status === 'completed' && outcome === 'no_order'
    ? 'No order'
    : status === 'completed' && kind !== 'production'
    ? (jobOrderId ? (jobStatus === 'cancelled' || jobStatus === 'rejected' ? 'Job order cancelled' : 'Job order made') : type && type !== 'consultation' ? 'Done' : 'Consultation done')
    : cfg.label;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span>{label}</span>
    </span>
  );
}

/**
 * On Time / Late is DERIVED by comparing `checked_in_at` against
 * `scheduled_at` at render time — there is no stored on_time/late status,
 * matching the Overdue badge's derivation pattern above. Renders nothing
 * until Staff has actually checked the client in.
 */
export function CheckInBadge({ checkedInAt, scheduledAt }: { readonly checkedInAt?: string | null; readonly scheduledAt?: string }) {
  if (!checkedInAt) return null;
  const isLate = !!scheduledAt && new Date(checkedInAt) > new Date(scheduledAt);
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${
        isLate
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
      title={`Checked in at ${new Date(checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
    >
      {isLate ? 'Late' : 'On Time'}
    </span>
  );
}

export function ChannelBadge({ channel }: { readonly channel?: 'walk_in' | 'online' }) {
  const isOnline = channel === 'online';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase border ${
        isOnline
          ? 'bg-sky-50 text-sky-700 border-sky-200'
          : 'bg-stone-50 text-stone-600 border-stone-200'
      }`}
      title={isOnline ? 'Booked online by customer via store profile' : 'Walk-in booking entered by the shop'}
    >
      {isOnline ? <Globe size={11} className="text-sky-600 shrink-0" /> : <Store size={11} className="text-stone-500 shrink-0" />}
      <span>{isOnline ? 'Online Booking' : 'Walk-in'}</span>
    </span>
  );
}

export function RescheduledBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-amber-50 text-amber-800 border border-amber-200"
      title="This appointment was rescheduled from an earlier date/time"
    >
      <RefreshCw size={10} className="text-amber-600 shrink-0" />
      <span>Rescheduled</span>
    </span>
  );
}

export function WalkInPriorityBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-amber-50 text-amber-900 border border-amber-300"
      title="This online booking slot was claimed by an in-store walk-in client. Reschedule required."
    >
      <RefreshCw size={10} className="text-amber-700 shrink-0" />
      <span>Walk-in Preempted</span>
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

/**
 * Earliest bookable time for a given date: no floor for a future date, or
 * the next quarter-hour from now if the date is today. Shared by every
 * appointment-scheduling surface (dashboard booking, reschedule, follow-up)
 * so "today" always means the actual current time, not midnight.
 */
export function minTimeForDate(dateStr: string, todayStr: string): string {
  if (dateStr !== todayStr) return '00:00';
  const now   = new Date();
  const mins  = now.getHours() * 60 + now.getMinutes();
  const round = Math.ceil(mins / 15) * 15;
  return `${String(Math.floor(round / 60) % 24).padStart(2, '0')}:${String(round % 60).padStart(2, '0')}`;
}

export function formatScheduled(iso: string) {
  // Strip trailing Z or +00:00 to ensure local atelier time is preserved without browser double-offset
  const cleanStr = iso ? iso.replace(/Z|\+00:00$/, '') : '';
  const formattedStr = cleanStr.includes('T') ? cleanStr : cleanStr.replace(' ', 'T');
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

/** Same words, ignoring case, spaces and closing punctuation ("Schedule unavailable." = "schedule unavailable"). */
export const sameText = (a?: string | null, b?: string | null) => {
  const norm = (v?: string | null) => (v ?? '').trim().replace(/[\s.!]+$/g, '').toLowerCase();
  return norm(a) === norm(b);
};

/** The name nobody gave: an older walk-in made with no name. It is shown as "not given yet", never as a person. */
export const PLACEHOLDER_NAME = 'Walk-in customer';
export const hasName = (name?: string | null) => Boolean(name && name.trim() && name.trim() !== PLACEHOLDER_NAME);
export const customerLabel = (name?: string | null) => (hasName(name) ? (name as string) : 'Name not given yet');

export function getCustomerInitials(name?: string): string {
  if (!name || !hasName(name)) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts.at(-1)?.[0] ?? '')).toUpperCase();
}

/** The number staff and customers can quote: A-0042. */
/** The email only when it is a real one: the placeholder login a walk-in gets is never shown. */
export const realEmail = (email?: string | null) => (email && !isWalkInEmail(email) ? email : null);

/** One line to reach the customer: their real email, else their number. */
export const contactLine = (c?: { email?: string | null; phone?: string | null } | null) =>
  realEmail(c?.email) || c?.phone?.trim() || 'No contact info';

export function appointmentNo(id: number): string {
  return `A-${String(id).padStart(4, '0')}`;
}

/** A complete date for a list: "Thu, Oct 16, 2026 · 2:30 PM". */
export function fullDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
  };
}

/** Strips legacy auto-generated consultation summary and redundant "Notes: " labels from customer notes. */
export function cleanCustomerNotes(notes?: string | null): string {
  return parseBookingNotes(notes).text;
}

/**
 * A booking's notes hold what the customer typed plus lines the booking form adds itself —
 * "[Requested Consultation: …]" and "[Material: …]". Splits them: the typed text, and what was said about the fabric.
 */
export function parseBookingNotes(notes?: string | null): { text: string; material: 'store_supplied' | 'customer_supplied' | null; materialNote: string } {
  const raw = notes ?? '';
  const own = raw.match(/\[Material:\s*Customer will bring own fabric\/sample(?:\s*-\s*([^\]]+))?\]/i);
  const shop = /\[Material:\s*Customer will use the shop's material\]/i.test(raw);
  const text = raw
    .replace(/\[Requested Consultation:[\s\S]*?\]\n?/gi, '')
    .replace(/\[Material:[^\]]*\]\n?/gi, '')
    .replace(/^Notes:\s*/i, '')
    .trim();
  return { text, material: own ? 'customer_supplied' : shop ? 'store_supplied' : null, materialNote: own?.[1]?.trim() ?? '' };
}

