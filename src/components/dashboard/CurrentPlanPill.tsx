'use client';

import Link from 'next/link';
import { Clock, CreditCard, Crown, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { PLAN_TONE } from '@/components/admin/ui/PlanPill';
import { daysLeft, useLatestSubscription } from '@/components/billing/TrialNotice';

const ICON: Record<string, typeof Crown> = { premium: Crown, pro: Zap, basic: CreditCard };
const on = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });

/**
 * The shop's plan at a glance on Home, in the plan's own colour (as in Admin): "Premium · Free trial · 14 days left",
 * "Basic plan · until Dec 26, 2026". Owners and branch managers only; opens Billing.
 */
export default function CurrentPlanPill() {
  const { store, user } = useAuthStore();
  const role = user?.roles?.[0]?.name;
  const sub = useLatestSubscription(store?.id, role === 'store_owner' || role === 'branch_manager');
  if (!sub?.plan?.name) return null;

  const slug = (sub.plan.slug ?? sub.plan.name).toLowerCase();
  const Icon = ICON[slug] ?? CreditCard;
  const tone = PLAN_TONE[slug] ?? PLAN_TONE.basic;
  let detail: string;
  if (sub.status === 'trial' && sub.ends_at) {
    const left = daysLeft(sub.ends_at);
    detail = `Free trial · ${left === 0 ? 'last day' : `${left} day${left === 1 ? '' : 's'} left`}`;
  } else if (sub.status === 'active' && sub.ends_at) {
    detail = sub.cancelled_at ? `cancelled · until ${on(sub.ends_at)}` : `until ${on(sub.ends_at)}`;
  } else {
    detail = 'Plan ended';
  }

  return (
    <Link href="/dashboard/billing" title="See your plan in Billing"
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-opacity hover:opacity-80 ${sub.status === 'expired' ? 'border-red-200 bg-red-50 text-red-700' : tone}`}>
      {sub.status === 'trial' ? <Clock size={13} aria-hidden="true" /> : <Icon size={13} aria-hidden="true" />}
      <span>{sub.plan.name}{sub.status === 'trial' ? '' : ' plan'}</span>
      <span className="font-normal opacity-80">· {detail}</span>
    </Link>
  );
}
