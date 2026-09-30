'use client';

import { Check } from 'lucide-react';
import { FileField, StepActions } from './ApplicationFields';
import PlatformPaymentBox from '@/components/shared/PlatformPaymentBox';
import { formatPeso, type BillingCycle, type PaymentMethod } from './applicationTypes';
import type { StoreApplicationState } from './useStoreApplication';

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];
const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'gcash', label: 'GCash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function PlanStep({ app }: { readonly app: StoreApplicationState }) {
  const { plans, planId, setPlanId, billingCycle, setBillingCycle, paymentMethod, setPaymentMethod, files, setFile, goTo, submit, submitting } = app;
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
                {(plan.features ?? []).slice(0, 5).map((f) => (
                  <li key={f} className="flex gap-2 mobile-caption text-ink-body"><Check size={13} className="mt-0.5 shrink-0 text-sage" />{f}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 border-t border-line pt-5">
        <div>
          <p className="text-sm text-ink mb-2">Payment Method<span className="text-danger">*</span></p>
          <div className="flex gap-3">
            {METHODS.map((m) => (
              <button key={m.value} type="button" aria-pressed={paymentMethod === m.value} onClick={() => setPaymentMethod(m.value)}
                className={`min-h-12 flex-1 border text-sm ${paymentMethod === m.value ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {paymentMethod === 'gcash' ? (
          <PlatformPaymentBox amount={Number(price)} note="Your plan starts once your shop is approved. After you pay, upload a screenshot of the GCash receipt below." />
        ) : (
          <div className="border border-line bg-sunken p-4 mobile-body-sm text-ink-body">
            Send <strong className="font-semibold text-ink">{formatPeso(price)}</strong> to SUTURA using the account details the SUTURA team gives you, then upload your receipt. Your plan starts once your shop is approved.
          </div>
        )}
        <FileField id="app-doc-payment_receipt" label="Payment Receipt" hint="Screenshot or photo — JPG, PNG, or WEBP" accept="image/*"
          file={files.payment_receipt} onChange={(file) => setFile('payment_receipt', file)} />
      </div>

      <StepActions onBack={() => goTo(3)} nextLabel={submitting ? 'Submitting…' : 'Submit Application'} busy={submitting || !selected} />
    </form>
  );
}
