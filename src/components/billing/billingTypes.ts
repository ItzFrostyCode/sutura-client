import React from 'react';
import { Rocket, Zap, Crown } from 'lucide-react';

export interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
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
