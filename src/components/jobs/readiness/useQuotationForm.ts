import { useState } from 'react';
import type { Job } from '../jobHelpers';
import { priceStart, round2, sumRows, unitBasis } from './quotationBasis';
import type { ChargeRow, ReadinessData } from './readinessTypes';

const day = (v: string | null | undefined) => (v ?? '').slice(0, 10);

/** The price, ready date and payment fields of the quotation, the total they make, and whether a reason is needed. */
export function useQuotationForm(job: Job, data: ReadinessData, currentTotal: number, pieces: number) {
  const q = data.quotation?.data;
  const basis = unitBasis(job);
  const rush: ChargeRow[] = data.order?.is_rush && data.order.rush_fee > 0 ? [{ label: 'Rush fee', amount: data.order.rush_fee }] : [];
  const [start] = useState(() => priceStart(q, pieces, basis.amount, rush));

  const [unit, setUnit] = useState(start.unit);
  const [discount, setDiscount] = useState(start.discount);
  const [extras, setExtras] = useState<ChargeRow[]>(start.extras);
  const [deductions, setDeductions] = useState<ChargeRow[]>(q?.customer_provided_deduction ?? []);
  const [dueDate, setDueDate] = useState(day(data.order?.due_date));
  const [notes, setNotes] = useState(q?.notes ?? '');
  const [policy, setPolicy] = useState(data.terms?.policy ?? 'deposit');
  const [percent, setPercent] = useState(data.terms?.percent ?? 50);
  const [validUntil, setValidUntil] = useState(day(data.decision?.valid_until));
  const [reason, setReason] = useState('');

  const goods = round2(unit * pieces);
  const total = Math.max(0, round2(goods + sumRows(extras) - sumRows(deductions) - discount));
  const deposit = policy === 'deposit' ? Math.round(total * percent) / 100 : null;

  // The same rule as the server (OrderFlowController): a reason is needed once a price was sent and the total (to the cent),
  // the ready date or the payment terms differ from what the order has now; pay-at-pick-up for the first time always needs one.
  const sent = Boolean(data.quotation?.approved_at) || (data.quotation?.versions ?? []).some((v) => v.status === 'final');
  const termsChanged = policy !== (data.terms?.policy ?? null) || ((policy === 'deposit' || policy === 'custom') && percent !== (data.terms?.percent ?? 50));
  const changed = round2(total) !== round2(data.quotation?.total ?? currentTotal) || dueDate !== day(data.order?.due_date) || termsChanged;
  const askChange = sent && changed;
  const askPickup = policy === 'none' && data.terms?.policy !== 'none';
  const needsReason = askChange || askPickup;

  const priceEdited = unit !== start.unit || discount !== start.discount || JSON.stringify(extras) !== JSON.stringify(start.extras) || JSON.stringify(deductions) !== JSON.stringify(q?.customer_provided_deduction ?? []);
  const resetPrices = () => { setUnit(start.unit); setDiscount(start.discount); setExtras(start.extras); setDeductions(q?.customer_provided_deduction ?? []); };

  const payload = (status: 'estimate' | 'final') => ({
    base_price: goods, quantity_adjustment: discount > 0 ? -discount : 0,
    additional_charges: extras, customer_provided_deduction: deductions,
    due_date: dueDate || null, notes: notes.trim() || null, status,
    payment_policy: policy, payment_policy_percent: policy === 'deposit' || policy === 'custom' ? percent : undefined,
    valid_until: validUntil || undefined, reason: needsReason && reason.trim() ? reason.trim() : undefined,
  });

  return {
    basis, unit, setUnit, discount, setDiscount, extras, setExtras, deductions, setDeductions, goods, total, deposit,
    dueDate, setDueDate, notes, setNotes, policy, setPolicy, percent, setPercent, validUntil, setValidUntil,
    reason, setReason, needsReason, askChange, priceEdited, resetPrices, payload,
  };
}

export type QuotationFormState = ReturnType<typeof useQuotationForm>;
