import React from 'react';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import { peso } from './readinessFormat';

interface QuotationFooterProps {
  readonly total: number;
  readonly deposit: number | null;
  readonly busy: boolean;
  /** What is missing after a send was tried (the buttons are never left silently greyed out). */
  readonly message: string | null;
  readonly onSubmit: (status: 'estimate' | 'final') => void;
}

/** Total on the left, the two ways to save on the right, and one line saying how they differ. */
export default function QuotationFooter({ total, deposit, busy, message, onSubmit }: QuotationFooterProps) {
  return (
    <div className="w-full space-y-3">
      {message && <p role="alert" className="text-sm font-medium text-danger">{message}</p>}
      <p className="text-[13px] text-ink-muted">Estimate: not sent for approval yet, you can still change it. Final: the customer is asked to approve it, ask for changes, or decline.</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[17px] font-semibold text-ink">Total {peso(total)}</p>
          {deposit !== null && <p className="text-[13px] text-ink-muted">Deposit {peso(deposit)}</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" disabled={busy} onClick={() => onSubmit('estimate')} className={BTN}>Save as estimate</button>
          <button type="button" disabled={busy} onClick={() => onSubmit('final')} className={BTN_PRIMARY}>Finalize &amp; send</button>
        </div>
      </div>
    </div>
  );
}
