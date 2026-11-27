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
  const { plans, planId, setPlanId, billingCycle, setBillingCycle, setPayOnline, freeTrial, setFreeTrial, goTo, submit, submitting, uploadProgress, termsAccepted, setTermsAccepted } = app;
  // Photos are shrunk first (null), then uploaded (0–100), then the server saves it all.
  const sendingLabel = uploadProgress === null ? 'Preparing photos…' : uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : 'Finishing…';
  const method: Method = freeTrial ? 'trial' : 'online';
  const pick = (m: Method) => (m === 'trial' ? setFreeTrial(true) : setPayOnline(true));
  const selected = plans.find((p) => p.id === planId);
  const price = selected ? (billingCycle === 'yearly' ? selected.price_yearly : selected.price_monthly) : 0;

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-8">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="Billing cycle">
        {CYCLES.map((c) => (
          <button key={c.value} type="button" role="radio" aria-checked={billingCycle === c.value} onClick={() => setBillingCycle(c.value)}
            className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${billingCycle === c.value ? 'bg-ink text-white' : 'text-ink-muted hover:bg-sunken hover:text-ink'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Subscription plan">
        {plans.map((plan) => {
          const on = plan.id === planId;
          return (
            <button key={plan.id} type="button" role="radio" aria-checked={on} onClick={() => setPlanId(plan.id)}
              className={`flex flex-col rounded-2xl border p-5 text-left shadow-[0_1px_2px_rgba(45,42,38,0.04)] transition-colors ${on ? 'border-ink bg-surface ring-1 ring-ink' : 'border-line bg-surface hover:border-line-strong'}`}>
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

      <div className="space-y-4">
        <div>
          <h3 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">How do you want to start?<span className="text-danger" aria-hidden="true">*</span></h3>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
            {METHODS.map((m) => {
              const on = method === m.key;
              return (
                <button key={m.key} type="button" role="radio" aria-checked={on} onClick={() => pick(m.key)}
                  className={`min-h-12 rounded-2xl border p-4 text-left transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-line-strong'}`}>
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className={`mt-1 block text-xs leading-relaxed ${on ? 'text-white/80' : 'text-ink-muted'}`}>{m.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
        {freeTrial ? (
          <div className="rounded-2xl bg-sunken p-5 text-sm leading-relaxed text-ink-body">
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
          <div className="rounded-2xl bg-sunken p-5 text-sm leading-relaxed text-ink-body">
            <p><span className="text-ink-muted">Amount:</span> <strong className="text-ink tabular-nums">{formatPeso(price)}</strong></p>
            <p className="mt-2">
              When you submit, we save your application and take you to GCash to pay. Your plan starts once your shop is approved.
              If it isn&apos;t approved, the payment is refunded to your GCash.
            </p>
          </div>
        )}
      </div>

      {/* Declaration + terms, right before Submit: it covers everything entered in every step. */}
      <label htmlFor="app-terms" className="flex cursor-pointer gap-3.5 rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(45,42,38,0.04)]">
        <input
          id="app-terms"
          type="checkbox"
          required
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
        />
        <span className="text-sm leading-relaxed text-ink-body">
          I confirm that the information and documents I submitted are true and belong to me or my business, and I agree
          to SUTURA&apos;s{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">Privacy Policy</a>.
          False information or documents may get the application rejected or the shop suspended.
          <span className="text-danger">*</span>
        </span>
      </label>

      {submitting && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Sending your application"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={uploadProgress ?? 0}
          aria-valuetext={sendingLabel}
        >
          <div
            className="h-full rounded-full bg-ink transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${uploadProgress ?? 0}%` }}
          />
        </div>
      )}

      <StepActions onBack={() => goTo(3)} nextLabel={submitting ? sendingLabel : freeTrial ? 'Submit and Start Free Trial' : 'Submit and Pay with GCash'} busy={submitting || !selected || !termsAccepted} />
    </form>
  );
}
