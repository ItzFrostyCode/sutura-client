'use client';

import { useState } from 'react';
import Link from 'next/link';
import ShopsContainer from './ShopsContainer';
import SectionHead from './SectionHead';
import PlanCard from './PlanCard';
import { useShopPlans } from './useShopPlans';
import { TRIAL_HREF } from './shopsLinks';
import type { BillingCycle } from '@/components/store-application/applicationTypes';

const CYCLES: { value: BillingCycle; label: string }[] = [{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }];

export default function ShopsPricing() {
  const { plans, loading, failed } = useShopPlans();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  return (
    <section id="pricing" aria-labelledby="shops-pricing-title" className="scroll-mt-16 py-12 sm:py-16 lg:py-20">
      <ShopsContainer>
        <SectionHead id="shops-pricing-title" overline="Pricing" title="Plans for one shop or a whole chain." lede="Start with 14 free days, then choose a plan whenever you are ready." />

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-300 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xl font-semibold text-ink">
              Free trial <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">₱0 for 14 days</span>
            </p>
            <p className="mobile-body-md mt-1 max-w-xl text-ink-body">Basic’s features, free for 14 days once your shop is approved. Nothing to pay and no receipt to upload.</p>
          </div>
          <Link href={TRIAL_HREF} className="btn-primary-mobile shrink-0 rounded-[10px] bg-ink px-6 text-white transition-transform hover:bg-espresso active:scale-[0.98]">Start free trial</Link>
        </div>

        <div role="radiogroup" aria-label="Billing cycle" className="mx-auto mt-8 flex w-full max-w-xs rounded-full bg-sunken p-1">
          {CYCLES.map((c) => (
            <button key={c.value} type="button" role="radio" aria-checked={cycle === c.value} onClick={() => setCycle(c.value)}
              className={`min-h-11 flex-1 rounded-full text-sm font-semibold transition-colors ${cycle === c.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'}`}>
              {c.label}
            </button>
          ))}
        </div>

        {failed ? (
          <p className="mobile-body-md mt-8 text-center text-ink-muted">We could not load the plans. Refresh the page to try again.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {loading
              ? [0, 1, 2].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-sunken" />)
              : plans.map((p, i) => <PlanCard key={p.id} plan={p} cycle={cycle} featured={plans.length === 3 && i === 1} />)}
          </div>
        )}
      </ShopsContainer>
    </section>
  );
}
