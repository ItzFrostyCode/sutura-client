import React from 'react';
import { Rocket, Zap, Crown } from 'lucide-react';

export interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly?: number | string | null;
  description: string;
  features: string[] | string | null;
  /** Server-built: the staff/branch limits, then the admin's feature lines. */
  display_features?: string[];
  max_staff: number;
  /** -1 = unlimited; set on the admin Plans page. */
  max_branches?: number | null;
  max_services: number;
}

export interface Subscription {
  plan_id: number;
  plan: Plan;
  status: string;
  starts_at: string;
  ends_at: string;
  /** Set when the shop started on a free trial. */
  trial_ends_at?: string | null;
  billing_cycle?: string;
  /** A downgrade queued for when this period ends (paid one: scheduled_payment_id). */
  scheduled_plan_id?: number | null;
  scheduled_billing_cycle?: string | null;
  scheduled_payment_id?: number | null;
  scheduled_plan?: { id: number; name: string } | null;
  /** Set when the owner cancelled: the plan still runs until ends_at, then the shop is read-only. */
  cancelled_at?: string | null;
}

/** A plan is running while it's active or on trial with its end date ahead; cancelled = running but cancelled. */
export function planRunState(sub: Subscription | null): { running: boolean; cancelled: boolean } {
  const running = Boolean(
    sub && ['active', 'trial'].includes(sub.status) && sub.ends_at && new Date(sub.ends_at).getTime() > Date.now(),
  );
  return { running, cancelled: running && Boolean(sub?.cancelled_at) };
}

export const PLAN_META: Record<
  string,
  {
    icon: React.ElementType;
    badge?: string;
    cardClass: string;
    btnClass: string;
    iconBg: string;
  }
> = {
  basic: {
    icon: Rocket,
    badge: undefined,
    cardClass: 'border-line hover:border-line-strong',
    btnClass: 'bg-sunken hover:bg-line text-ink-body',
    iconBg: 'bg-sunken text-taupe',
  },
  pro: {
    icon: Zap,
    badge: undefined,
    cardClass: 'border-line hover:border-line-strong',
    btnClass: 'bg-sunken hover:bg-line text-ink-body',
    iconBg: 'bg-sunken text-taupe',
  },
  premium: {
    icon: Crown,
    badge: 'Most Popular',
    cardClass: 'border-taupe ring-1 ring-taupe/30',
    btnClass: 'bg-taupe hover:bg-taupe-hover text-white',
    iconBg: 'bg-sunken text-taupe',
  },
};

export function getPlanMeta(slug: string) {
  return PLAN_META[slug] ?? PLAN_META.basic;
}

// Fallback only, for a plan with no max_branches saved (same rule as
// SubscriptionPlan::branchLimit()): Branch Shops beyond the Main Shop.
export const BRANCH_LIMITS: Record<string, number | null> = {
  basic: 0,
  pro: 0,
  premium: null,
};

// Every row must match what the server actually enforces — this table is a
// promise to the shop. Staff Accounts, Services, and Branch Shops are rendered
// separately from each plan's live max_staff / max_services / max_branches
// (PlanComparisonSection). Sources: catalog — CatalogController (pro);
// dashboard charts & analytics — SubscriptionGate (pro); sales & staff reports —
// AnalyticsController::staffProductivity (pro); branch comparison —
// AnalyticsController::branchComparison (premium); export —
// ReceiptExportController (premium); SMS — SmsController / SmsOutbox (pro);
// featured — SubscriptionSwitcher / StoreController (premium).
export const COMPARE_ROWS = [
  { label: 'Catalog Designs & Gallery Photos', basic: '—', pro: 'Unlimited', premium: 'Unlimited' },
  { label: 'Visual Dashboard & Analytics', basic: '—', pro: 'Included', premium: 'Included' },
  { label: 'Sales & Staff Reports', basic: '—', pro: 'Included', premium: 'Included' },
  { label: 'Branch Comparison Reports', basic: '—', pro: '—', premium: 'Included' },
  { label: 'Receipt & Statement Export (CSV/ZIP)', basic: '—', pro: '—', premium: 'Included' },
  { label: 'SMS Notifications to Customers', basic: '—', pro: 'Included', premium: 'Included' },
  { label: 'Featured Store Visibility', basic: '—', pro: '—', premium: 'Included' },
];

export interface UpgradeRequest {
  id: number;
  type?: 'new_shop' | 'upgrade' | 'renewal' | 'downgrade';
  plan_id: number;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  billing_cycle: 'monthly' | 'yearly';
  quoted_price: string | number;
  payment_reference: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  plan?: { id: number; name: string };
  /** online = paid with GCash in SUTURA (confirmed automatically); receipt = screenshot upload. */
  channel?: 'online' | 'receipt';
  gateway_status?: 'awaiting' | 'paid' | 'expired' | null;
  refund_amount?: string | number | null;
  refund_status?: 'pending' | 'succeeded' | 'failed' | null;
  refunded_at?: string | null;
}

/** What the Billing page shows after coming back from the GCash checkout. */
export type OnlinePaymentResult =
  | { state: 'checking' }
  | { state: 'paid'; plan: string | null; until: string | null; started: boolean }
  | { state: 'processing'; paymentId: number }
  | { state: 'failed' };

/** A plan's price for a cycle (yearly falls back to 10× monthly, matching the plan cards). */
export const planPrice = (plan: Plan, cycle: 'monthly' | 'yearly'): number =>
  cycle === 'yearly' ? Number(plan.price_yearly ?? plan.price_monthly * 10) : plan.price_monthly;

/** Mirrors the server: every paid plan takes a GCash payment (a step down included). */
export const planNeedsPayment = (plan: Plan): boolean => plan.price_monthly > 0;

/** What paying for this plan does: renewal, upgrade, or a downgrade that starts at the end of the period. */
export type PaymentKind = 'renewal' | 'upgrade' | 'downgrade';
export const paymentKind = (plan: Plan, current: Subscription | null): PaymentKind => {
  const running = current && ['active', 'trial'].includes(current.status) && (!current.ends_at || new Date(current.ends_at).getTime() > Date.now());
  if (!running) return 'upgrade';
  if (current.plan_id === plan.id) return 'renewal';
  return plan.price_monthly < current.plan.price_monthly ? 'downgrade' : 'upgrade';
};
