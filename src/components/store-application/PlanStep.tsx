'use client';

import { Check } from 'lucide-react';
import { StepActions } from './ApplicationFields';
import { formatPeso, type BillingCycle } from './applicationTypes';
import type { StoreApplicationState } from './useStoreApplication';

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];
// Plan payments: pay in the GCash app right after submitting (default), or a 14-day free trial.
const TRIAL_DAYS = 14;
type Method = 'online' | 'trial';
const METHODS: { key: Method; label: string; hint: string }[] = [
  { key: 'online', label: 'Pay with GCash', hint: 'After you submit, you’ll pay in the GCash app.' },
  { key: 'trial', label: `Free trial: ${TRIAL_DAYS} days`, hint: 'Nothing to pay now. Choose a plan before it ends.' },
];

export default function PlanStep({ app }: { readonly app: StoreApplicationState }) {
  const { plans, planId, setPlanId, billingCycle, setBillingCycle, setPayOnline, freeTrial, setFreeTrial, goTo, submit, submitting, termsAccepted, setTermsAccepted } = app;
  const method: Method = freeTrial ? 'trial' : 'online';
  const pick = (m: Method) => (m === 'trial' ? setFreeTrial(true) : setPayOnline(true));
  const selected = plans.find((p) => p.id === planId);
  const price = selected ? (billingCycle === 'yearly' ? selected.price_yearly : selected.price_monthly) : 0;

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
      <div className="grid grid-cols-2 border border-line-strong" role="radiogroup" aria-label="Billing cycle">
        {CYCLES.map((c) => (
          <button key={c.value} type="button" role="radio" aria-checked={billingCycle === c.value} onClick={() => setBillingCycle(c.value)}
            className={`min-h-12 text-sm font-semibold uppercase tracking-widest ${billingCycle === c.value ? 'bg-ink text-white' : 'bg-surface text-ink-muted'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Subscription plan">
        {plans.map((plan) => {
          const on = plan.id === planId;
          return (
            <button key={plan.id} type="button" role="radio" aria-checked={on} onClick={() => setPlanId(plan.id)}
              className={`flex flex-col border p-4 text-left transition-colors ${on ? 'border-ink bg-sunken' : 'border-line-strong bg-surface hover:border-ink'}`}>
              <span className="mobile-h3 text-ink">{plan.name}</span>
              <span className="mt-1 text-2xl font-bold text-ink">
                {formatPeso(billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly)}
                <span className="text-sm font-normal text-ink-muted">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
              </span>
              {plan.description && <span className="mobile-body-sm mt-2 text-ink-muted">{plan.description}</span>}
              <ul className="mt-3 space-y-1.5">
                {/* Every line set on the admin Plans page, not a preview of the first few. */}
                {(plan.display_features ?? plan.features ?? []).map((f) => (
                  <li key={f} className="flex gap-2 mobile-caption text-ink-body"><Check size={13} className="mt-0.5 shrink-0 text-sage" />{f}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 border-t border-line pt-5">
        <div>
          <p className="text-sm text-ink mb-2">How do you want to start?<span className="text-danger">*</span></p>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
            {METHODS.map((m) => {
              const on = method === m.key;
              return (
                <button key={m.key} type="button" role="radio" aria-checked={on} onClick={() => pick(m.key)}
                  className={`min-h-12 border p-3 text-left ${on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink'}`}>
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className={`mt-1 block text-xs leading-relaxed ${on ? 'text-white/80' : 'text-ink-muted'}`}>{m.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
        {freeTrial ? (
          <div className="border border-line bg-sunken p-4 mobile-body-sm text-ink-body">
            <p>
              You get <strong className="text-ink">{selected?.name ?? 'the plan you picked'}</strong> free for {TRIAL_DAYS} days,
              starting when your shop is approved. No payment now.
            </p>
            <p className="mt-2">
              Before it ends, choose a plan in Billing ({formatPeso(price)}/{billingCycle === 'yearly' ? 'yr' : 'mo'} for this one).
              If you don&apos;t, your shop is paused: hidden from customers, with all your records kept until you pay.
              One free trial per shop.
            </p>
          </div>
        ) : (
          <div className="border border-line bg-sunken p-4 mobile-body-sm text-ink-body">
            <p><span className="text-ink-muted">Amount:</span> <strong className="text-ink tabular-nums">{formatPeso(price)}</strong></p>
            <p className="mt-2">
              When you submit, we save your application and take you to GCash to pay. Your plan starts once your shop is approved.
              If it isn&apos;t approved, the payment is refunded to your GCash.
            </p>
          </div>
        )}
      </div>

      {/* Declaration + terms, right before Submit: it covers everything entered in every step. */}
      <label htmlFor="app-terms" className="flex cursor-pointer gap-3 border-t border-line pt-5">
        <input
          id="app-terms"
          type="checkbox"
          required
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
        />
        <span className="mobile-body-sm text-ink-body">
          I confirm that the information and documents I submitted are true and belong to me or my business, and I agree
          to SUTURA&apos;s{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">Privacy Policy</a>.
          False information or documents may get the application rejected or the shop suspended.
          <span className="text-danger">*</span>
        </span>
      </label>

      <StepActions onBack={() => goTo(3)} nextLabel={submitting ? 'Submitting…' : freeTrial ? 'Submit and Start Free Trial' : 'Submit and Pay with GCash'} busy={submitting || !selected || !termsAccepted} />
    </form>
  );
}
