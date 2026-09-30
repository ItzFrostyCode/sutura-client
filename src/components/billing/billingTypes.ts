import React from 'react';
import { Rocket, Zap, Crown } from 'lucide-react';

export interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly?: number | string | null;
  description: string;
  features: string;
  max_staff: number;
  max_services: number;
}

export interface Subscription {
  plan_id: number;
  plan: Plan;
  status: string;
  starts_at: string;
  ends_at: string;
  billing_cycle?: string;
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

export const BRANCH_LIMITS: Record<string, number | null> = {
  basic: 1,
  pro: 1,
  premium: null,
};

export const COMPARE_ROWS = [
  { label: 'Branches', basic: '1', pro: '1', premium: 'Unlimited' },
  { label: 'Gallery Photos', basic: 'Unlimited', pro: 'Unlimited', premium: 'Unlimited' },
  { label: 'Service Packages', basic: 'Up to 3', pro: 'Unlimited', premium: 'Unlimited' },
  { label: 'Analytics & Reports', basic: 'Basic', pro: 'Advanced', premium: 'Full Suite' },
  { label: 'SMS Notifications', basic: '—', pro: 'Included', premium: 'Included' },
  { label: 'Featured Visibility', basic: '—', pro: '—', premium: 'Included' },
  { label: 'Priority Support', basic: '—', pro: '—', premium: 'Included' },
];

export interface UpgradeRequest {
  id: number;
  plan_id: number;
  billing_cycle: 'monthly' | 'yearly';
  quoted_price: string | number;
  payment_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  plan?: { id: number; name: string };
}

/** A plan's price for a cycle (yearly falls back to 10× monthly, matching the plan cards). */
export const planPrice = (plan: Plan, cycle: 'monthly' | 'yearly'): number =>
  cycle === 'yearly' ? Number(plan.price_yearly ?? plan.price_monthly * 10) : plan.price_monthly;

/** Mirrors the server: a paid plan that is not a step down takes a payment. */
export const planNeedsPayment = (plan: Plan, currentMonthly: number | null): boolean =>
  plan.price_monthly > 0 && (currentMonthly === null || plan.price_monthly >= currentMonthly);
