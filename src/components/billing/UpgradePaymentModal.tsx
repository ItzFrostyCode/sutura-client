'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import PlatformPaymentBox from '@/components/shared/PlatformPaymentBox';
import { FileField, INPUT_CLASS } from '@/components/store-application/ApplicationFields';
import { paymentKind, planPrice, type PaymentDetails, type Plan, type Subscription } from './billingTypes';
import DowngradeTerms from './DowngradeTerms';

interface UpgradePaymentModalProps {
  readonly plan: Plan | null;
  readonly current: Subscription | null;
  readonly onClose: () => void;
  /** acceptTerms: a downgrade's terms were agreed to (the server refuses a downgrade without it). */
  readonly onSubmit: (planId: number, cycle: 'monthly' | 'yearly', receipt: File, details: PaymentDetails, acceptTerms?: boolean) => Promise<boolean>;
  /** Opens the GCash checkout (the browser leaves the page on success). */
  readonly onPayOnline: (planId: number, cycle: 'monthly' | 'yearly', acceptTerms?: boolean) => Promise<boolean>;
}

type Method = 'online' | 'receipt';
const METHODS: { value: Method; label: string; hint: string }[] = [
  { value: 'online', label: 'Pay with GCash', hint: 'Pay in the GCash app. Your plan updates as soon as it goes through.' },
  { value: 'receipt', label: 'Upload a receipt', hint: 'Already sent it to SUTURA’s GCash? Attach the screenshot for the team to check.' },
];
const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CYCLES: { value: 'monthly' | 'yearly'; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
// datetime-local value for "now" in the owner's time zone.
const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function Field({ id, label, hint, optional = false, children }: { readonly id: string; readonly label: string; readonly hint?: string; readonly optional?: boolean; readonly children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-ink mb-1.5">
        {label}
        {optional ? <span className="text-ink-muted"> (optional)</span> : <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

// Paying for a plan, two ways: GCash checkout (default; the plan changes once GCash
// confirms it), or the backup: send the fee to SUTURA's GCash, attach the receipt
// screenshot and copy its details, and an admin checks it before the plan changes.
export default function UpgradePaymentModal({ plan, current, onClose, onSubmit, onPayOnline }: Readonly<UpgradePaymentModalProps>) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [method, setMethod] = useState<Method>('online');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [details, setDetails] = useState<PaymentDetails>({ reference: '', senderName: '', senderNumber: '', amountSent: '', paidAt: '' });
  const [sending, setSending] = useState(false);
  // A downgrade first shows its warning + terms; payment comes after "I agree".
  const [agreed, setAgreed] = useState(false);
  const [termsDone, setTermsDone] = useState(false);

  useEffect(() => {
    if (plan) {
      setCycle('monthly');
      setMethod('online');
      setReceipt(null);
      setDetails({ reference: '', senderName: '', senderNumber: '', amountSent: String(planPrice(plan, 'monthly')), paidAt: nowLocal() });
      setAgreed(false);
      setTermsDone(false);
    }
  }, [plan]);

  // Keep "amount sent" on the price until the owner edits it.
  const changeCycle = (c: 'monthly' | 'yearly') => {
    if (plan && details.amountSent === String(planPrice(plan, cycle))) setDetails((d) => ({ ...d, amountSent: String(planPrice(plan, c)) }));
    setCycle(c);
  };

  const send = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!plan) return;
    if (method === 'online') {
      setSending(true);
      const opened = await onPayOnline(plan.id, cycle, isDowngrade && agreed);
      setSending(false);
      // The GCash checkout opens in its own modal.
      if (opened) onClose();
      return;
    }
    if (!receipt) return;
    setSending(true);
    const ok = await onSubmit(plan.id, cycle, receipt, details, isDowngrade && agreed);
    setSending(false);
    if (ok) onClose();
  };

  const kind = plan ? paymentKind(plan, current) : 'upgrade';
  const isDowngrade = kind === 'downgrade';
  const showTerms = isDowngrade && !termsDone;
  // An upgrade keeps the days left on the running plan (or trial), day for day (server: SubscriptionSwitcher::apply).
  const daysLeft = current?.ends_at && ['active', 'trial'].includes(current.status)
    ? Math.max(0, Math.ceil((new Date(current.ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;
  const carryEnd = current?.ends_at
    ? new Date(new Date(current.ends_at).getTime() + (cycle === 'yearly' ? 365 : 30) * 86_400_000).toISOString()
    : null;
  const confirmWhen = method === 'online' ? 'once GCash confirms your payment' : 'once the SUTURA team confirms your payment';
  const note = !plan ? '' : kind === 'downgrade' && current?.ends_at
    ? `You stay on ${current.plan.name} until ${day(current.ends_at)}. Once this payment is confirmed, your shop moves to ${plan.name} from then.`
    : kind === 'renewal' && current?.ends_at
      ? `Renewing adds the new period after ${day(current.ends_at)}, so you don't lose any days.`
      : kind === 'upgrade' && daysLeft > 0 && carryEnd
        ? `Your ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left on ${current?.plan.name} carry over. You get ${plan.name} right away ${confirmWhen}, and it runs until ${day(carryEnd)}.`
        : method === 'online'
        ? 'Your plan changes as soon as GCash confirms your payment.'
        : 'Your plan changes as soon as the SUTURA team confirms your payment.';
  const set = (key: keyof PaymentDetails) => (e: React.ChangeEvent<HTMLInputElement>) => setDetails((d) => ({ ...d, [key]: e.target.value }));
  // The ref no. is optional; if typed, it needs at least 6 characters (same as the server).
  const refOk = details.reference.trim() === '' || details.reference.trim().length >= 6;
  const complete = method === 'online' || receipt && refOk && details.senderName.trim() && /^09\d{9}$/.test(details.senderNumber)
    && Number(details.amountSent) > 0 && details.paidAt;

  const title = plan
    ? showTerms ? `Before you switch to ${plan.name}` : `${kind === 'renewal' ? 'Renew' : kind === 'downgrade' ? 'Switch to' : 'Pay for'} ${plan.name}`
    : 'Pay for plan';

  return (
    <Modal
      isOpen={plan !== null}
      onClose={onClose}
      title={title}
      maxWidth="max-w-lg"
      footer={
        showTerms ? (
          <>
            <button type="button" onClick={onClose} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer">
              Keep my plan
            </button>
            <button type="button" onClick={() => setTermsDone(true)} disabled={!agreed} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold cursor-pointer disabled:opacity-50">
              Continue to payment
            </button>
          </>
        ) : (
        <>
          {isDowngrade ? (
            <button type="button" onClick={() => setTermsDone(false)} disabled={sending} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">
              Back
            </button>
          ) : (
            <button type="button" onClick={onClose} disabled={sending} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">
              Cancel
            </button>
          )}
          <button type="submit" form="upgrade-payment-form" disabled={sending || !complete || (isDowngrade && !agreed)} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {sending && <Loader2 size={16} className="animate-spin" />}
            {method === 'online' ? <>Continue to GCash {!sending && <ArrowUpRight size={16} aria-hidden />}</> : 'Send for review'}
          </button>
        </>
        )
      }
    >
      {plan && showTerms && current && (
        <DowngradeTerms from={current.plan} to={plan} endsAt={current.ends_at ?? null} agreed={agreed} onAgree={setAgreed} />
      )}
      {plan && !showTerms && (
        <form id="upgrade-payment-form" onSubmit={send} className="space-y-5">
          <div className="grid grid-cols-2 border border-line-strong" role="radiogroup" aria-label="Billing cycle">
            {CYCLES.map((c) => (
              <button key={c.value} type="button" role="radio" aria-checked={cycle === c.value} onClick={() => changeCycle(c.value)}
                className={`min-h-12 text-sm font-semibold uppercase tracking-widest cursor-pointer ${cycle === c.value ? 'bg-ink text-white' : 'bg-surface text-ink-muted'}`}>
                {c.label}
              </button>
            ))}
          </div>

          <fieldset>
            <legend className="text-sm text-ink mb-2">How do you want to pay?</legend>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => {
                const on = method === m.value;
                return (
                  <button key={m.value} type="button" role="radio" aria-checked={on} onClick={() => setMethod(m.value)}
                    className={`text-left p-3 border cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${on ? 'border-ink bg-white' : 'border-line bg-surface hover:border-line-strong'}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span aria-hidden className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-ink' : 'border-line-strong'}`}>
                        {on && <span className="size-1.5 rounded-full bg-ink" />}
                      </span>
                      {m.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{m.hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {method === 'online' ? (
            <div className="border border-line bg-sunken p-4 text-sm text-ink-body space-y-3">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-ink-muted">Plan</dt>
                <dd className="font-semibold text-ink">{plan.name} · {cycle === 'yearly' ? 'Yearly' : 'Monthly'}</dd>
                <dt className="text-ink-muted">Amount</dt>
                <dd className="font-semibold text-ink tabular-nums">{peso(planPrice(plan, cycle))}</dd>
              </dl>
              <p>{note}</p>
              <p className="text-xs text-ink-muted">You&apos;ll go to GCash to pay, then come back here automatically. Keep this tab open until it does.</p>
            </div>
          ) : (
          <>
          <PlatformPaymentBox amount={planPrice(plan, cycle)} note={`${note} After you pay, attach the GCash receipt and copy its details below.`} />

          <FileField id="upgrade-receipt" label="GCash receipt screenshot" hint="Screenshot or photo — JPG, PNG, or WEBP (max 5 MB)" accept="image/png,image/jpeg,image/webp" file={receipt ?? undefined} onChange={setReceipt} />

          <Field id="upgrade-reference" label="GCash reference number" optional hint="The Ref No. on your GCash receipt. Adding it helps us confirm your payment faster.">
            <input id="upgrade-reference" value={details.reference} onChange={set('reference')} maxLength={50} autoComplete="off" className={`${INPUT_CLASS} font-mono tabular-nums`} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="upgrade-sender-name" label="Sender name">
              <input id="upgrade-sender-name" required value={details.senderName} onChange={set('senderName')} maxLength={100} autoComplete="name" className={INPUT_CLASS} />
            </Field>
            <Field id="upgrade-sender-number" label="Sender GCash number">
              <input id="upgrade-sender-number" required inputMode="numeric" placeholder="09XXXXXXXXX" value={details.senderNumber}
                onChange={(e) => setDetails((d) => ({ ...d, senderNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))} className={`${INPUT_CLASS} tabular-nums`} />
            </Field>
            <Field id="upgrade-amount" label="Amount sent (₱)">
              <input id="upgrade-amount" required type="number" min="1" step="0.01" value={details.amountSent} onChange={set('amountSent')} className={`${INPUT_CLASS} tabular-nums`} />
            </Field>
            <Field id="upgrade-paid-at" label="Date and time paid">
              <input id="upgrade-paid-at" required type="datetime-local" max={nowLocal()} value={details.paidAt} onChange={set('paidAt')} className={INPUT_CLASS} />
            </Field>
          </div>
          </>
          )}
        </form>
      )}
    </Modal>
  );
}
