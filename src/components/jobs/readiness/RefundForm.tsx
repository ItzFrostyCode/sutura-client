import React, { useRef } from 'react';
import RadioGroup from '../ui/RadioGroup';
import { BTN_PRIMARY, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import { peso } from './readinessFormat';
import { useRefundForm, type RefundType } from './useRefundForm';
import type { ReadinessData } from './readinessTypes';

const OPTIONS = [
  { value: 'full', label: 'Full refund', hint: 'No production started and materials not marked ready.' },
  { value: 'minus_materials', label: 'Refund minus materials', hint: 'Materials are ready, production has not started.' },
  { value: 'partial', label: 'Partial refund', hint: 'Production has started.' },
  { value: 'none', label: 'No refund', hint: 'A reason is required.' },
];
const COST_LABEL: Partial<Record<RefundType, string>> = { minus_materials: "Materials cost the shop can't recover", partial: 'Materials + work already done' };

/** Pick a refund type (preselected from the order), see the sum, and record it. */
export default function RefundForm({ storeId, jobId, data, onRecorded }: Readonly<{ storeId: number; jobId: number; data: ReadinessData; onRecorded: () => void }>) {
  const box = useRef<HTMLDivElement>(null);
  const f = useRefundForm(storeId, jobId, data, onRecorded);
  const focusField = (id: string) => box.current?.querySelector<HTMLElement>(`#${id}`)?.focus();
  if (!f.suggestion) return null;
  if (f.paid <= 0) return <p className="text-sm text-ink-muted">Nothing was paid on this order, so there is nothing to refund.</p>;

  return (
    <div ref={box} className="space-y-4">
      <RadioGroup name="refund-type" legend="What do you give back?" options={OPTIONS} value={f.type} onChange={(v) => f.setType(v as RefundType)} />
      {COST_LABEL[f.type] && (
        <div>
          <label htmlFor="refund-cost" className={PLAIN_LABEL}>{COST_LABEL[f.type]}</label>
          <input id="refund-cost" type="number" inputMode="decimal" min={0} step="0.01" value={f.cost} onChange={(e) => f.setCost(e.target.value)} className={PLAIN_FIELD} />
          <input aria-label="What was spent (optional note)" value={f.costNote} onChange={(e) => f.setCostNote(e.target.value)} maxLength={255} placeholder="What was spent, e.g. fabric already cut (optional)" className={`${PLAIN_FIELD} mt-2`} />
        </div>
      )}
      {f.type === 'none' && (
        <div>
          <label htmlFor="refund-reason" className={PLAIN_LABEL}>Why no refund?</label>
          <textarea id="refund-reason" value={f.reason} onChange={(e) => f.setReason(e.target.value)} rows={2} maxLength={1000} className={`${PLAIN_FIELD} h-auto min-h-20 resize-y py-3`} />
        </div>
      )}
      <p className="text-sm font-medium text-ink">Paid {peso(f.paid)} − {peso(f.costs)} = Refund {peso(f.refund)}</p>
      {f.type !== 'none' && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink"><input type="checkbox" checked={f.handedBack} onChange={(e) => f.setHandedBack(e.target.checked)} className="h-4 w-4 accent-espresso" />Already handed back to the customer</label>
      )}
      {f.error && <p role="alert" className="text-sm font-medium text-rose-700">{f.error}</p>}
      <button type="button" disabled={f.saving} onClick={() => void f.record(focusField)} className={BTN_PRIMARY}>{f.type === 'none' ? 'Record no refund' : 'Record refund'}</button>
    </div>
  );
}
