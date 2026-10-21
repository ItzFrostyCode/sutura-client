import React, { useState } from 'react';
import Modal from '@/components/Modal';
import ChargeRows from './ChargeRows';
import { peso } from './readinessFormat';
import type { Blocker, ChargeRow, ReadinessData } from './readinessTypes';

interface QuotationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly data: ReadinessData;
  /** The order's current total — the starting price the first time a quotation is written. */
  readonly currentTotal: number;
  readonly busy: boolean;
  readonly blockers: Blocker[];
  readonly onSave: (body: Record<string, unknown>) => Promise<boolean>;
}

const field = 'w-full px-3 py-2 bg-canvas border border-line rounded-lg text-base sm:text-sm text-ink focus:outline-none focus:border-taupe';
const sum = (rows: ChargeRow[]) => rows.reduce((t, r) => t + (Number(r.amount) || 0), 0);

export default function QuotationModal({ isOpen, onClose, data, currentTotal, busy, blockers, onSave }: QuotationModalProps) {
  const q = data.quotation?.data;
  const [base, setBase] = useState(q?.base_price ?? currentTotal);
  const [qtyAdj, setQtyAdj] = useState(q?.quantity_adjustment ?? 0);
  const [extras, setExtras] = useState<ChargeRow[]>(q?.additional_charges ?? (data.order?.is_rush && data.order.rush_fee > 0 ? [{ label: 'Rush fee', amount: data.order.rush_fee }] : []));
  const [deductions, setDeductions] = useState<ChargeRow[]>(q?.customer_provided_deduction ?? []);
  const [dueDate, setDueDate] = useState(data.order?.due_date ?? '');
  const [notes, setNotes] = useState(q?.notes ?? '');
  const [policy, setPolicy] = useState(data.terms?.policy ?? 'deposit');
  const [percent, setPercent] = useState(data.terms?.percent ?? 50);
  const [validUntil, setValidUntil] = useState(data.decision?.valid_until ?? '');
  const [reason, setReason] = useState('');
  // Once a price was sent, a change needs a reason; choosing "pay when picking up" always does.
  const sent = (data.quotation?.versions?.length ?? 0) > 0 && (data.quotation?.status === 'final' || Boolean(data.quotation?.approved_at));
  const needsReason = sent || (policy === 'none' && data.terms?.policy !== 'none');

  const total = Math.max(0, Number(base) + Number(qtyAdj) + sum(extras) - sum(deductions));
  const cap = data.capacity;

  const submit = async (status: 'estimate' | 'final') => {
    const ok = await onSave({
      base_price: Number(base) || 0, quantity_adjustment: Number(qtyAdj) || 0,
      additional_charges: extras, customer_provided_deduction: deductions,
      due_date: dueDate || null, notes: notes.trim() || null, status,
      payment_policy: policy, payment_policy_percent: policy === 'deposit' || policy === 'custom' ? percent : undefined,
      valid_until: validUntil || undefined, reason: reason.trim() || undefined,
    });
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quotation"
      maxWidth="max-w-xl"
      footer={(
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-muted">Total <strong className="text-lg text-ink">{peso(total)}</strong></p>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => submit('estimate')} className="h-11 rounded-lg border border-line px-4 text-sm font-semibold text-ink-body hover:bg-sunken disabled:opacity-50">Save as estimate</button>
            <button type="button" disabled={busy || (needsReason && !reason.trim())} onClick={() => submit('final')} className="h-11 rounded-lg bg-espresso px-4 text-sm font-semibold text-white hover:bg-espresso/90 disabled:opacity-50">Finalize quotation</button>
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-muted">An <strong>estimate</strong> can still change. A <strong>final</strong> quotation needs the specs approved, the measurements verified and a completion date. It is sent to the customer, who can approve it, ask for changes, or decline.</p>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Service price
            <input type="number" inputMode="decimal" min={0} step="0.01" value={base || ''} onChange={(e) => setBase(Number(e.target.value))} className={`${field} normal-case tracking-normal font-normal`} />
          </label>
          <label className="space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Quantity pricing (+/−)
            <input type="number" inputMode="decimal" step="0.01" value={qtyAdj || ''} onChange={(e) => setQtyAdj(Number(e.target.value))} placeholder="0.00" className={`${field} normal-case tracking-normal font-normal`} />
          </label>
        </div>

        <ChargeRows title="Additional charges" hint="Embroidery, special materials, rush, other approved add-ons." rows={extras} onChange={setExtras} labelPlaceholder="e.g. Embroidery" />
        <ChargeRows title="Less: customer-provided items" hint="Fabric or items the customer brings, so the shop does not charge for them." rows={deductions} onChange={setDeductions} labelPlaceholder="e.g. Customer's fabric" />

        <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Agreed completion date
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${field} normal-case tracking-normal font-normal`} />
        </label>
        {cap && (
          <p className={`rounded-lg border px-3 py-2 text-xs ${cap.has_conflict ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-line bg-canvas text-ink-muted'}`}>
            Capacity check: {cap.branch_open_orders} open order{cap.branch_open_orders === 1 ? '' : 's'} at this branch
            {cap.due_within_2_days !== null && `, ${cap.due_within_2_days} due within 2 days of this date`}.
            {cap.tailors.filter((t) => t.conflicts.length > 0).map((t) => ` ${t.name} also has ${t.conflicts.map((c) => c.order_number).join(', ')} due around then.`)}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Payment terms
            <select value={policy} onChange={(e) => setPolicy(e.target.value)} className={`${field} normal-case tracking-normal font-normal`}>
              <option value="deposit">Deposit before we start</option>
              <option value="full">Full payment before we start</option>
              <option value="none">Pay when picking up</option>
            </select>
          </label>
          {policy === 'deposit' ? (
            <label className="space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Deposit (%)
              <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className={`${field} normal-case tracking-normal font-normal`} />
            </label>
          ) : <span />}
        </div>
        <p className="-mt-2 text-[11px] text-ink-muted">The customer sees these terms with the price, before they answer. After they agree, the terms are locked.</p>

        <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Price valid until (optional)
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={`${field} normal-case tracking-normal font-normal`} />
        </label>

        <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Note for the customer (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} className={`${field} resize-none normal-case tracking-normal font-normal`} />
        </label>

        {needsReason && (
          <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">{sent ? 'Why did the price, date or terms change?' : 'Why can this customer pay when picking up?'}
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} className={`${field} normal-case tracking-normal font-normal`} />
          </label>
        )}

        {blockers.length > 0 && (
          <ul role="alert" className="list-disc space-y-0.5 rounded-lg border border-amber-300 bg-amber-50 py-2 pl-7 pr-3 text-xs text-amber-900">
            {blockers.map((b) => <li key={b.key}>{b.message}</li>)}
          </ul>
        )}
      </div>
    </Modal>
  );
}
