'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import PlatformPaymentBox from '@/components/shared/PlatformPaymentBox';
import { FileField } from '@/components/store-application/ApplicationFields';
import { planPrice, type Plan } from './billingTypes';

interface UpgradePaymentModalProps {
  readonly plan: Plan | null;
  readonly onClose: () => void;
  readonly onSubmit: (planId: number, cycle: 'monthly' | 'yearly', receipt: File, reference: string) => Promise<boolean>;
}

const CYCLES: { value: 'monthly' | 'yearly'; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

// Paying for a plan: send the fee by GCash, attach the receipt screenshot
// (shown back so it can be checked), and an admin confirms before the plan changes.
export default function UpgradePaymentModal({ plan, onClose, onSubmit }: Readonly<UpgradePaymentModalProps>) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (plan) {
      setCycle('monthly');
      setReceipt(null);
      setReference('');
    }
  }, [plan]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !receipt) return;
    setSending(true);
    const ok = await onSubmit(plan.id, cycle, receipt, reference);
    setSending(false);
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={plan !== null}
      onClose={onClose}
      title={plan ? `Pay for ${plan.name}` : 'Pay for plan'}
      maxWidth="max-w-lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={sending} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" form="upgrade-payment-form" disabled={sending || !receipt} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {sending && <Loader2 size={16} className="animate-spin" />} Send for review
          </button>
        </>
      }
    >
      {plan && (
        <form id="upgrade-payment-form" onSubmit={send} className="space-y-5">
          <div className="grid grid-cols-2 border border-line-strong" role="radiogroup" aria-label="Billing cycle">
            {CYCLES.map((c) => (
              <button key={c.value} type="button" role="radio" aria-checked={cycle === c.value} onClick={() => setCycle(c.value)}
                className={`min-h-12 text-sm font-semibold uppercase tracking-widest cursor-pointer ${cycle === c.value ? 'bg-ink text-white' : 'bg-surface text-ink-muted'}`}>
                {c.label}
              </button>
            ))}
          </div>

          <PlatformPaymentBox amount={planPrice(plan, cycle)} note="Your plan changes once the SUTURA team confirms your payment. After you pay, attach a screenshot of the GCash receipt." />

          <FileField id="upgrade-receipt" label="GCash receipt screenshot" hint="Screenshot or photo — JPG, PNG, or WEBP (max 5 MB)" accept="image/*" file={receipt ?? undefined} onChange={setReceipt} />

          <div>
            <label htmlFor="upgrade-reference" className="block text-sm text-ink mb-1">GCash reference number <span className="text-ink-faint">(optional)</span></label>
            <input id="upgrade-reference" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} className="w-full h-12 px-3.5 border border-line-strong bg-surface text-base text-ink focus:outline-none focus:border-ink" />
          </div>
        </form>
      )}
    </Modal>
  );
}
