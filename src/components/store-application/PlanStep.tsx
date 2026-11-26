'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import PlatformPaymentBox from '@/components/shared/PlatformPaymentBox';
import { CheckRow, ChoiceCard, enterMovesOn, FieldError, FileField, Group, Req, revealFirstProblem, Segmented, StepActions } from './ApplicationFields';
import { formatPeso, type BillingCycle } from './applicationTypes';
import type { StoreApplicationState } from './useStoreApplication';

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];
// Plan payments: pay in the GCash app right after submitting (default), pay SUTURA's GCash first and attach the
// receipt (works without the online checkout, e.g. on a local copy), or the team lead's 14-day free trial of the
// picked plan (any plan; one per shop; the server starts it on approval).
const TRIAL_DAYS = 14;
type Method = 'online' | 'receipt' | 'trial';
const METHODS: { key: Method; label: string; hint: string }[] = [
  { key: 'online', label: 'Pay with GCash online', hint: 'After you submit, you’ll pay in the GCash app.' },
  { key: 'receipt', label: 'Upload a GCash receipt', hint: 'Send to SUTURA’s GCash first, then attach the screenshot.' },
  { key: 'trial', label: `Free trial: ${TRIAL_DAYS} days`, hint: 'Nothing to pay now. Choose a plan before it ends.' },
];

export default function PlanStep({ app }: { readonly app: StoreApplicationState }) {
  const { plans, planId, setPlanId, billingCycle, setBillingCycle, payOnline, setPayOnline, freeTrial, setFreeTrial, files, setFile, goTo, submit, submitting, termsAccepted, setTermsAccepted } = app;
  const method: Method = freeTrial ? 'trial' : payOnline ? 'online' : 'receipt';
  const pick = (m: Method) => (m === 'trial' ? setFreeTrial(true) : setPayOnline(m === 'online'));
  const selected = plans.find((p) => p.id === planId);
  const price = selected ? (billingCycle === 'yearly' ? selected.price_yearly : selected.price_monthly) : 0;

  const [tried, setTried] = useState(false);
  const planErrors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!selected) e['app-plans'] = 'Choose a plan.';
    if (method === 'receipt' && !files.payment_receipt) e['app-doc-payment_receipt'] = 'Attach the screenshot of your GCash payment.';
    if (!termsAccepted) e['app-terms'] = 'Tick this box to agree before you submit.';
    return e;
  };
  const errors: Record<string, string> = { ...app.serverErrors, ...(tried ? planErrors() : {}) };

  return (
    <form
      noValidate
      onKeyDown={enterMovesOn}
      onSubmit={(e) => {
        e.preventDefault();
        app.clearServerErrors();
        setTried(true);
        const problems = planErrors();
        if (Object.keys(problems).length > 0) { revealFirstProblem(Object.keys(problems)); return; }
        void submit();
      }}
      className="space-y-7"
    >
      <section id="app-plans" data-field="app-plans" className="scroll-mt-24">
        <div className="mb-3 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Plan<Req /></h3>
          <Segmented label="Billing cycle" options={CYCLES} value={billingCycle} onChange={setBillingCycle} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Subscription plan">
          {plans.map((plan) => {
            const on = plan.id === planId;
            return (
              <ChoiceCard key={plan.id} on={on} onClick={() => setPlanId(plan.id)}>
                <span className="pr-8 text-[17px] font-semibold text-ink">{plan.name}</span>
                <span className="mt-1 text-[26px] font-bold tracking-tight text-ink">
                  {formatPeso(billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly)}
                  <span className="text-[15px] font-normal text-ink-muted">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                </span>
                <span className="mt-2 inline-flex w-fit items-center rounded-full bg-sage/15 px-2.5 py-0.5 text-[12px] font-semibold text-sage">Free for {TRIAL_DAYS} days</span>
                {plan.description && <span className="mt-2 text-[13px] text-ink-muted">{plan.description}</span>}
                <ul className="mt-3 space-y-1.5 border-t border-line/80 pt-3">
                  {/* Every line set on the admin Plans page, not a preview of the first few. */}
                  {(plan.display_features ?? plan.features ?? []).map((f) => (
                    <li key={f} className="flex gap-2 text-[13px] text-ink-body"><Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0 text-sage" aria-hidden="true" />{f}</li>
                  ))}
                </ul>
              </ChoiceCard>
            );
          })}
        </div>
        <FieldError id="app-plans-error" message={errors['app-plans']} />
      </section>

      <section id="app-pay-method" data-field="app-pay-method" className="scroll-mt-24">
        <h3 className="mb-3 px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-muted">How do you want to pay?<Req /></h3>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
          {METHODS.map((m) => (
            <ChoiceCard key={m.key} on={method === m.key} onClick={() => pick(m.key)}>
              <span className="pr-8 text-[15px] font-semibold text-ink">{m.label}</span>
              <span className="mt-1 text-[13px] leading-relaxed text-ink-muted">{m.hint}</span>
            </ChoiceCard>
          ))}
        </div>
      </section>

      {method === 'trial' ? (
        <Group>
          <p className="text-[15px] text-ink-body">
            You get <strong className="font-semibold text-ink">{selected?.name ?? 'the plan you picked'}</strong> free for {TRIAL_DAYS} days,
            starting when your shop is approved. No payment now.
          </p>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            Before it ends, choose a plan in Billing ({formatPeso(price)}/{billingCycle === 'yearly' ? 'yr' : 'mo'} for this one). If you don&apos;t,
            your shop is paused: hidden from customers, with all your records kept until you pay. One free trial per shop.
          </p>
        </Group>
      ) : method === 'receipt' ? (
        <div className="space-y-4">
          <PlatformPaymentBox amount={Number(price)} planName={selected?.name} note="Your plan starts once your shop is approved. After you pay, attach the screenshot of the GCash receipt below." />
          <FileField id="app-doc-payment_receipt" label="Payment receipt" hint="Screenshot of your GCash receipt" accept="image/*"
            file={files.payment_receipt} onChange={(file) => setFile('payment_receipt', file)} error={errors['app-doc-payment_receipt']} />
        </div>
      ) : (
        <Group>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] text-ink-muted">Amount</span>
            <strong className="text-[22px] font-bold tabular-nums tracking-tight text-ink">{formatPeso(price)}</strong>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted">
            When you submit, we save your application and take you to GCash to pay. Your plan starts once your shop is approved.
            If it isn&apos;t approved, the payment is refunded to your GCash.
          </p>
        </Group>
      )}

      {/* Declaration + terms, right before Submit: it covers everything entered in every step. */}
      <div data-field="app-terms">
        <CheckRow id="app-terms" required checked={termsAccepted} onChange={setTermsAccepted} invalid={!!errors['app-terms']}>
          I confirm that the information and documents I submitted are true and belong to me or my business, and I agree
          to SUTURA&apos;s{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">Privacy Policy</a>.
          False information or documents may get the application rejected or the shop suspended.
        </CheckRow>
        <FieldError id="app-terms-error" message={errors['app-terms']} />
      </div>

      {/* Never greyed out for a missing answer: pressing it shows what is left. */}
      <StepActions onBack={() => goTo(3)} nextLabel={submitting ? 'Submitting…' : method === 'trial' ? 'Submit and start free trial' : method === 'receipt' ? 'Submit application' : 'Submit and pay with GCash'} busy={submitting} />
    </form>
  );
}
