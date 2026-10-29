'use client';

import React, { useEffect, useRef } from 'react';
import { Ban } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import RadioGroup from '../ui/RadioGroup';
import { BTN, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import { peso } from '../readiness/readinessFormat';
import { AGREED_VIA_OPTIONS, REASON_OPTIONS } from './cancelOptions';
import { MISTAKE, useCancelOrder } from './useCancelOrder';

interface CancelOrderPanelProps {
  readonly storeId: number;
  readonly jobId: number;
  readonly job: { total_amount?: number | string; balance: number | string; discount_amount?: number | string | null };
  readonly onClose: () => void;
  readonly onCancelled: () => void;
}

/** The cancel form, in the page (not a pop-up): why, how the customer agreed, and what was paid. Shown at the top of the Steps tab. */
export default function CancelOrderPanel({ storeId, jobId, job, onClose, onCancelled }: CancelOrderPanelProps) {
  // paid = total - balance - discount
  const paid = Math.max(0, (Number(job.total_amount) || 0) - (Number(job.balance) || 0) - (Number(job.discount_amount) || 0));
  const box = useRef<HTMLElement>(null);
  const c = useCancelOrder(storeId, jobId, onCancelled);
  // The server refuses "made by mistake" once money was taken (that is a real cancellation with a refund), so the form says so up front.
  const moneyTaken = paid > 0.009;
  const blocked = c.reason === MISTAKE && moneyTaken;

  useEffect(() => { box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);

  const focusField = (name: string) => {
    const el = name === 'cancel-agreed' ? document.getElementById(name) : box.current?.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    el?.focus();
  };

  return (
    <section ref={box} className="space-y-5 rounded-2xl border border-rose-200 bg-surface p-5 shadow-2xs sm:p-6">
      <SectionHeader icon={Ban} title="Cancel this order" subtitle="The order moves to Closed and can no longer be worked on. Unless it was made by mistake, the customer must agree." />

      <RadioGroup name="cancel-reason" legend="Why is it being cancelled?" options={REASON_OPTIONS} value={c.reason} onChange={c.setReason} />

      <div>
        <label htmlFor="cancel-note" className={PLAIN_LABEL}>Note (optional)</label>
        <textarea id="cancel-note" value={c.note} onChange={(e) => c.setNote(e.target.value)} rows={2} maxLength={500} className={`${PLAIN_FIELD} h-auto min-h-20 resize-y py-3`} />
      </div>

      {c.reason === MISTAKE ? (
        <p className={`text-sm ${blocked ? 'font-medium text-rose-700' : 'text-ink-body'}`}>
          {blocked
            ? `${peso(paid)} was already taken on this order, so it cannot be cancelled as made by mistake. Choose another reason: the customer must agree, and you can record the refund after.`
            : 'The order was made by mistake, so the customer does not need to agree and is not told. The consultation it came from is released so the right order can be made from it.'}
        </p>
      ) : (
        <>
          <RadioGroup name="cancel-agreed-via" legend="How did the customer agree?" options={AGREED_VIA_OPTIONS} value={c.agreedVia} onChange={c.setAgreedVia} />

          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
            <input id="cancel-agreed" type="checkbox" checked={c.agreed} onChange={(e) => c.setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-espresso" />
            The customer agreed to cancel this order.
          </label>
        </>
      )}

      <p className="text-[13px] text-ink-muted">
        Paid so far {peso(paid)}.{c.reason === MISTAKE ? '' : ' After cancelling you can record a refund (optional).'}
      </p>

      <div className="space-y-3">
        {c.error && <p role="alert" className="text-sm font-medium text-rose-700">{c.error}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onClose} className={BTN}>Keep the order</button>
          <button type="button" disabled={c.busy || blocked} onClick={() => void c.submit(focusField)} className={`${BTN} text-rose-700`}>{c.busy ? 'Cancelling…' : 'Cancel the order'}</button>
        </div>
      </div>
    </section>
  );
}
