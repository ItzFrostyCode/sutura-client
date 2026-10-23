import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { Job } from '../jobTypes';
import { METHOD_CONFIG } from './financialsTypes';
import { CASHIER_SHELL } from './CashierReview';
import type { RecordedPayment } from './useJobFinancials';
import { printInPlace } from '@/lib/printInPlace';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';

/** Shown right after a payment is recorded, with a one-tap receipt print. */
export function CashierRecorded({ job, recorded, onDone }: Readonly<{ job: Job; recorded: RecordedPayment; onDone: () => void }>) {
  const label = METHOD_CONFIG[recorded.method]?.label ?? recorded.method;
  const pending = recorded.method !== 'cash';
  return (
    <div className={CASHIER_SHELL}>
      <div className="space-y-2 text-center">
        <CheckCircle2 size={32} className="mx-auto text-sage" />
        <h3 className="text-[17px] font-semibold text-ink">Payment recorded</h3>
        <p className="text-sm text-ink-body">₱{recorded.amount.toFixed(2)} · {label}</p>
        {pending && <p className="text-[13px] text-amber-800">Pending verification. It will not reduce the balance until an owner or branch manager verifies it.</p>}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onDone} className={`${BTN} flex-1`}>Done</button>
        {recorded.paymentId != null && (
          <button type="button" onClick={() => printInPlace(`/print/jobs/${job.id}/receipt?payment=${recorded.paymentId}`)} className={`${BTN_PRIMARY} flex-1`}>
            <Printer size={16} /> Print receipt
          </button>
        )}
      </div>
    </div>
  );
}
