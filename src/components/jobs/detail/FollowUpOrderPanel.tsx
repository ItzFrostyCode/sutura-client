'use client';

import React, { useEffect, useRef } from 'react';
import { CopyPlus } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import RadioGroup from '../ui/RadioGroup';
import { BTN, BTN_PRIMARY, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import type { Job } from '../jobTypes';
import { useFollowUpOrder } from './useFollowUpOrder';

const WHY = [
  { value: 'shop', label: "Shop's mistake — free fix", hint: 'A new order at ₱0 that starts in Confirmed. Nothing to price or approve.' },
  { value: 'customer', label: "Customer's request or a repeat order", hint: 'A new order with the details filled in. It goes through Request as usual.' },
];

/** "New follow-up order" on a completed order: why, then either a free fix made right here or the new-order form. Shown at the top of the Steps tab (not a pop-up). */
export default function FollowUpOrderPanel({ storeId, job, onClose }: Readonly<{ storeId: number; job: Job; onClose: () => void }>) {
  const box = useRef<HTMLElement>(null);
  const f = useFollowUpOrder(storeId, job);
  useEffect(() => { box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);
  const focusField = (id: string) => document.getElementById(id)?.focus();

  return (
    <section ref={box} className="space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6">
      <SectionHeader icon={CopyPlus} title="New follow-up order" subtitle={`A new order linked to ${job.order_number}. This order stays as it is.`} />
      <RadioGroup name="follow-up-why" legend="Why a follow-up order?" options={WHY} value={f.why} onChange={(v) => f.setWhy(v as 'shop' | 'customer')} />

      {f.why === 'shop' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="follow-up-description" className={PLAIN_LABEL}>What needs fixing?</label>
            <textarea id="follow-up-description" value={f.description} onChange={(e) => f.setDescription(e.target.value)} rows={3} maxLength={500} className={`${PLAIN_FIELD} h-auto min-h-20 resize-y py-3`} />
          </div>
          <div>
            <label htmlFor="follow-up-pieces" className={PLAIN_LABEL}>How many pieces? (optional)</label>
            <input id="follow-up-pieces" type="number" inputMode="numeric" min={1} value={f.pieces} onChange={(e) => f.setPieces(e.target.value)} placeholder="Leave empty for the whole order" className={`${PLAIN_FIELD} max-w-xs`} />
          </div>
        </div>
      )}

      {f.error && <p role="alert" className="text-sm font-medium text-rose-700">{f.error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onClose} className={BTN}>Close</button>
        {f.why === 'shop' && <button type="button" disabled={f.busy} onClick={() => void f.createFreeFix(focusField)} className={BTN_PRIMARY}>{f.busy ? 'Creating…' : 'Create free fix'}</button>}
        {f.why === 'customer' && <button type="button" onClick={f.createOrder} className={BTN_PRIMARY}>Create order</button>}
      </div>
    </section>
  );
}
