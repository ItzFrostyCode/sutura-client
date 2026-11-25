import type { BadgeVariant } from '@/components/shared/Badge';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentType = 'new_shop' | 'upgrade' | 'renewal' | 'downgrade';

/** One row of Admin → Payments (Admin\PlatformPaymentController::row). */
export interface PlatformPayment {
  id: number;
  type: PaymentType;
  status: PaymentStatus;
  billing_cycle: 'monthly' | 'yearly';
  amount_due: number;
  amount_sent: number | null;
  payment_reference: string | null;
  sender_name: string | null;
  sender_number: string | null;
  paid_at_reported: string | null;
  has_receipt: boolean;
  rejection_reason: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
  reviewed_at: string | null;
  resubmission_of_id: number | null;
  warning_count: number;
  store: { id: number; name: string } | null;
  owner: { name: string; email: string; phone: string | null } | null;
  plan: { id: number; name: string } | null;
  reviewer: string | null;
  /** online = paid with GCash in SUTURA (confirmed automatically); receipt = screenshot upload. */
  channel: 'online' | 'receipt';
  gateway_paid_at: string | null;
  refundable: boolean;
  refund_amount: number | null;
  refund_status: 'pending' | 'succeeded' | 'failed' | null;
  refund_reason: string | null;
  refunded_at: string | null;
}

/** "GCash" for one paid in SUTURA, "GCash · Receipt" for a screenshot upload. */
export const methodLabel = (p: Pick<PlatformPayment, 'channel'>): string => (p.channel === 'online' ? 'GCash' : 'GCash · Receipt');

export const REFUND_STATUS_LABEL = { pending: 'Refund processing', succeeded: 'Refunded', failed: 'Refund failed' } as const;

/** Refund reasons (the code is what the payment service records). */
export const REFUND_REASONS = [
  { code: 'CANCELLATION', label: 'Application rejected' },
  { code: 'DUPLICATE', label: 'Paid twice' },
  { code: 'REQUESTED_BY_CUSTOMER', label: 'Requested by the shop' },
  { code: 'OTHERS', label: 'Other' },
] as const;
export type RefundReasonCode = (typeof REFUND_REASONS)[number]['code'];

export interface PaymentDetail extends PlatformPayment {
  logs: { id: number; action: string; note: string | null; created_at: string; by: string | null }[];
  warnings: { code: string; message: string }[];
  store_subscription: { plan: string | null; status: string; ends_at: string | null; scheduled_plan: string | null } | null;
}

export interface PaymentStats {
  to_verify: number;
  with_applications: number;
  paid_this_month: number;
  paid_this_month_count: number;
  total_revenue: number;
  refunded_total: number;
  rejected_open: number;
  active_subscriptions: number;
  total: number;
  paid: number;
  pending: number;
}

export interface GcashSettings {
  name: string | null;
  number: string | null;
  qr_url: string | null;
}

// Plan payments go through the GCash gateway: "pending" = checkout started, GCash
// hasn't confirmed yet (the webhook, or a Re-sync, settles it). Old receipt uploads
// still use "pending" for "waiting for an admin to check" (paymentStatusLabel).
export const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Processing',
  approved: 'Paid',
  rejected: 'Failed / Rejected',
};

/** A row's status in words: an old receipt still waiting is "Waiting for review", not "Processing". */
export const paymentStatusLabel = (p: Pick<PlatformPayment, 'status' | 'channel'>, short = false): string => {
  if (p.status === 'pending') return p.channel === 'receipt' ? (short ? 'To review' : 'Waiting for review') : 'Processing';
  if (p.status === 'rejected') return p.channel === 'online' ? 'Failed' : 'Rejected';
  return 'Paid';
};

export const STATUS_BADGE: Record<PaymentStatus, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export const TYPE_LABEL: Record<PaymentType, string> = {
  new_shop: 'New shop',
  upgrade: 'Upgrade',
  renewal: 'Renewal',
  downgrade: 'Downgrade',
};

/** Bold + colored type label; hues kept apart from the status badges (amber / green / red). */
export const TYPE_CLASS: Record<PaymentType, string> = {
  new_shop: 'font-bold text-taupe',
  upgrade: 'font-bold text-blue-700',
  renewal: 'font-bold text-teal-700',
  downgrade: 'font-bold text-orange-700',
};

export const QUICK_REJECT_REASONS = [
  'Reference not found in GCash',
  'Amount incorrect',
  'Unclear screenshot',
  'Sender name or number does not match',
];

/** ₱1,999.00 — thousands separators, always two decimals. */
export function peso(value: number | string | null | undefined): string {
  return `₱${Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Date-range presets → YYYY-MM-DD (Asia/Manila calendar days, like the server). */
export type DatePreset = '' | 'today' | '7d' | '30d' | 'month' | 'custom';

export function presetRange(preset: DatePreset): { from: string; to: string } {
  const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const now = new Date();
  const ago = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
  switch (preset) {
    case 'today': return { from: day(now), to: day(now) };
    case '7d': return { from: day(ago(6)), to: day(now) };
    case '30d': return { from: day(ago(29)), to: day(now) };
    case 'month': {
      const today = day(now);
      return { from: `${today.slice(0, 8)}01`, to: today };
    }
    default: return { from: '', to: '' };
  }
}
