'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { paymentKind, planPrice, type Plan, type Subscription } from './billingTypes';
import DowngradeTerms from './DowngradeTerms';

interface UpgradePaymentModalProps {
  readonly plan: Plan | null;
  readonly current: Subscription | null;
  readonly onClose: () => void;
  /** Opens the GCash checkout. acceptTerms: a downgrade's terms were agreed to (the server refuses a downgrade without it). */
  readonly onPayOnline: (planId: number, cycle: 'monthly' | 'yearly', acceptTerms?: boolean) => Promise<boolean>;
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CYCLES: { value: 'monthly' | 'yearly'; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });


// Paying for a plan: GCash checkout; the plan changes once GCash confirms it.
export default function UpgradePaymentModal({ plan, current, onClose, onPayOnline }: Readonly<UpgradePaymentModalProps>) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [sending, setSending] = useState(false);
  // A downgrade first shows its warning + terms; payment comes after "I agree".
  const [agreed, setAgreed] = useState(false);
  const [termsDone, setTermsDone] = useState(false);

  useEffect(() => {
    if (plan) {
      setCycle('monthly');
      setAgreed(false);
      setTermsDone(false);
    }
  }, [plan]);


  const send = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!plan) return;
    setSending(true);
    const opened = await onPayOnline(plan.id, cycle, isDowngrade && agreed);
    setSending(false);
    // The GCash checkout opens in its own modal.
    if (opened) onClose();
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
  const confirmWhen = 'once GCash confirms your payment';
  const note = !plan ? '' : kind === 'downgrade' && current?.ends_at
    ? `You stay on ${current.plan.name} until ${day(current.ends_at)}. Once this payment is confirmed, your shop moves to ${plan.name} from then.`
    : kind === 'renewal' && current?.ends_at
      ? `Renewing adds the new period after ${day(current.ends_at)}, so you don't lose any days.`
      : kind === 'upgrade' && daysLeft > 0 && carryEnd
        ? `Your ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left on ${current?.plan.name} carry over. You get ${plan.name} right away ${confirmWhen}, and it runs until ${day(carryEnd)}.`
        : 'Your plan changes as soon as GCash confirms your payment.';

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
          <button type="submit" form="upgrade-payment-form" disabled={sending || (isDowngrade && !agreed)} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {sending && <Loader2 size={16} className="animate-spin" />}
            Continue to GCash {!sending && <ArrowUpRight size={16} aria-hidden />}
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
              <button key={c.value} type="button" role="radio" aria-checked={cycle === c.value} onClick={() => setCycle(c.value)}
                className={`min-h-12 text-sm font-semibold uppercase tracking-widest cursor-pointer ${cycle === c.value ? 'bg-ink text-white' : 'bg-surface text-ink-muted'}`}>
                {c.label}
              </button>
            ))}
          </div>

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
        </form>
      )}
    </Modal>
  );
}
