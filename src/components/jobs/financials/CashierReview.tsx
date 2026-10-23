import React from 'react';
import { CheckCircle2, Loader2, Printer, Receipt } from 'lucide-react';
import { Job } from '../jobTypes';
import { METHOD_CONFIG } from './financialsTypes';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import SectionHeader from '../ui/SectionHeader';
import { printInPlace } from '@/lib/printInPlace';

export const CASHIER_SHELL = 'h-full space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6';

interface ReviewProps {
  readonly method: string;
  readonly amount: number;
  readonly cashTendered: number;
  readonly change: number;
  readonly reference: string;
  readonly receiptUrl: string;
  readonly charging: boolean;
  readonly onConfirm: () => Promise<void>;
  readonly onBack: () => void;
}

/** "Confirm before this is recorded": nothing is sent until the cashier confirms here. */
export function CashierReview({ method, amount, cashTendered, change, reference, receiptUrl, charging, onConfirm, onBack }: ReviewProps) {
  const label = METHOD_CONFIG[method]?.label ?? method;
  return (
    <div className={CASHIER_SHELL}>
      <SectionHeader icon={Receipt} title="Review Payment" subtitle="Confirm before this is recorded" as="h3" />

      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between"><span className="text-ink-muted">{method === 'cash' ? 'Amount' : method === 'other' ? 'Received' : `Sent via ${label}`}</span><span className="font-semibold text-ink">₱{amount.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-ink-muted">Method</span><span className="font-medium text-ink">{label}</span></div>
        {method === 'cash' && (
          <>
            <div className="flex justify-between"><span className="text-ink-muted">Cash Tendered</span><span className="font-medium text-ink">₱{cashTendered.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-line pt-3"><span className="text-ink-muted">Change</span><span className="text-lg font-semibold text-sage">₱{change.toFixed(2)}</span></div>
          </>
        )}
        {method !== 'cash' && reference && (
          <div className="flex justify-between"><span className="text-ink-muted">Reference no.</span><span className="font-medium text-ink">{reference}</span></div>
        )}
        {method !== 'cash' && receiptUrl && (
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">{method === 'other' ? 'Photo' : 'Screenshot'}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptUrl} alt="Receipt screenshot" className="h-20 w-20 rounded-xl object-cover" />
          </div>
        )}
      </div>

      {method !== 'cash' && (
        <div className="rounded-xl bg-amber-500/[0.07] px-3.5 py-3 text-[13px] text-amber-800">
          This {METHOD_CONFIG[method]?.label ?? 'e-payment'} payment will be logged as <strong className="font-semibold">Pending Verification</strong> — it won&apos;t reduce the balance until an owner or branch manager verifies the receipt.
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} disabled={charging} className={`${BTN} flex-1`}>Back</button>
        <button type="button" onClick={onConfirm} disabled={charging} className={`${BTN_PRIMARY} flex-1`}>
          {charging ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>{charging ? 'Recording…' : 'Confirm & Record'}</span>
        </button>
      </div>
    </div>
  );
}

/** Shown in place of the form once nothing is owed. */
export function CashierSettled({ job }: Readonly<{ job: Job }>) {
  return (
    <div className="space-y-2 rounded-xl bg-sage/10 p-5 text-center">
      <CheckCircle2 size={32} className="mx-auto text-sage" />
      <h4 className="text-[15px] font-semibold text-ink">Order Fully Settled</h4>
      <p className="text-[13px] text-ink-body">There is no outstanding balance due on this job order.</p>
      <button type="button" onClick={() => printInPlace(`/print/jobs/${job.id}/receipt`)} className={`${BTN} mt-2`}>
        <Printer size={14} /> Print Final Statement
      </button>
    </div>
  );
}
