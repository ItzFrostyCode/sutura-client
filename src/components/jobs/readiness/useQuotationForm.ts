import { useState } from 'react';
import { clampDeposit } from '@/components/jobs/requirements';
import type { Job } from '../jobHelpers';
import { orderFabricDeduction, orderLines, priceStart, round2, sumRows, unitBasis, type QuoteLine } from './quotationBasis';
import type { ChargeRow, ReadinessData } from './readinessTypes';

const day = (v: string | null | undefined) => (v ?? '').slice(0, 10);

/** The price, ready date and payment fields of the quotation, the total they make, and whether a reason is needed. */
export function useQuotationForm(job: Job, data: ReadinessData, currentTotal: number, pieces: number) {
  const q = data.quotation?.data;
  const basis = unitBasis(job);
  const rush: ChargeRow[] = data.order?.is_rush && data.order.rush_fee > 0 ? [{ label: 'Rush fee', amount: data.order.rush_fee }] : [];
  const [start] = useState(() => priceStart(q, pieces, basis.amount, rush));

  // People on the order got different options: price it line by line (unless an older saved price no longer matches them).
  const [startLines] = useState<QuoteLine[] | null>(() => {
    const ol = orderLines(job);
    if (!ol) return null;
    return !q || Math.abs(ol.reduce((t, l) => t + l.unit * l.qty, 0) - (Number(q.base_price) || 0)) < 0.01 ? ol : null;
  });
  // A first quotation starts with the customer's own fabric already taken off, as the order was placed.
  const startDeductions = q ? q.customer_provided_deduction ?? [] : orderFabricDeduction(job);
  const [unit, setUnit] = useState(start.unit);
  const [lines, setLines] = useState<QuoteLine[] | null>(startLines);
  const [discount, setDiscount] = useState(start.discount);
  const [extras, setExtras] = useState<ChargeRow[]>(start.extras);
  const [deductions, setDeductions] = useState<ChargeRow[]>(startDeductions);
  const [dueDate, setDueDate] = useState(day(data.order?.due_date));
  const [notes, setNotes] = useState(q?.notes ?? '');
  // Production needs at least half paid first, so an old "pay at pick-up" or a smaller deposit opens as the 50% deposit.
  const [policy, setPolicy] = useState(data.terms?.policy === 'full' ? 'full' : 'deposit');
  const [percent, setPercent] = useState(clampDeposit(Number(data.terms?.percent ?? 50)));
  const [validUntil, setValidUntil] = useState(day(data.decision?.valid_until));
  const [reason, setReason] = useState('');

  const goods = lines ? round2(lines.reduce((t, l) => t + l.unit * l.qty, 0)) : round2(unit * pieces);
  const setLineUnit = (i: number, value: number) => setLines((ls) => ls && ls.map((l, k) => (k === i ? { ...l, unit: value } : l)));
  const total = Math.max(0, round2(goods + sumRows(extras) - sumRows(deductions) - discount));
  const deposit = policy === 'deposit' ? Math.round(total * percent) / 100 : null;

  // The same rule as the server (OrderFlowController): a reason is needed once a price was sent and the total (to the cent),
  // the ready date or the payment terms differ from what the order has now; pay-at-pick-up for the first time always needs one.
  const sent = Boolean(data.quotation?.approved_at) || (data.quotation?.versions ?? []).some((v) => v.status === 'final');
  const termsChanged = policy !== (data.terms?.policy ?? null) || ((policy === 'deposit' || policy === 'custom') && percent !== (data.terms?.percent ?? 50));
  const changed = round2(total) !== round2(data.quotation?.total ?? currentTotal) || dueDate !== day(data.order?.due_date) || termsChanged;
  const askChange = sent && changed;
  const needsReason = askChange;

  const priceEdited = unit !== start.unit || JSON.stringify(lines) !== JSON.stringify(startLines) || discount !== start.discount
    || JSON.stringify(extras) !== JSON.stringify(start.extras) || JSON.stringify(deductions) !== JSON.stringify(startDeductions);
  const resetPrices = () => { setUnit(start.unit); setLines(startLines); setDiscount(start.discount); setExtras(start.extras); setDeductions(startDeductions); };

  const payload = (status: 'estimate' | 'final') => ({
    base_price: goods, price_lines: lines ?? [], quantity_adjustment: discount > 0 ? -discount : 0,
    additional_charges: extras, customer_provided_deduction: deductions,
    due_date: dueDate || null, notes: notes.trim() || null, status,
    payment_policy: policy, payment_policy_percent: policy === 'deposit' || policy === 'custom' ? percent : undefined,
    valid_until: validUntil || undefined, reason: needsReason && reason.trim() ? reason.trim() : undefined,
  });

  return {
    basis, unit, setUnit, lines, setLineUnit, discount, setDiscount, extras, setExtras, deductions, setDeductions, goods, total, deposit,
    dueDate, setDueDate, notes, setNotes, policy, setPolicy, percent, setPercent, validUntil, setValidUntil,
    reason, setReason, needsReason, askChange, priceEdited, resetPrices, payload,
  };
}

export type QuotationFormState = ReturnType<typeof useQuotationForm>;
