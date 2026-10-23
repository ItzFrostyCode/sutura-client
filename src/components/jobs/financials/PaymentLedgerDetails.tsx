import React from 'react';
import { Payment } from '../jobTypes';

const money = (v: string | number | null | undefined) => `₱${Number.parseFloat(String(v ?? 0)).toFixed(2)}`;
const LINK = 'font-medium text-espresso hover:underline';

/** Third line of a ledger row: how much was handed over / sent, the reference and the proof, worded per method. */
export function PaymentLedgerDetails({ payment }: Readonly<{ payment: Payment }>) {
  const { payment_method: method, reference, receipt_path: proof } = payment;
  const parts: React.ReactNode[] = [];

  if (method === 'cash') {
    if (payment.change_amount != null) parts.push(`Tendered ${money(payment.cash_tendered)} · Change ${money(payment.change_amount)}`);
    if (reference) parts.push(`Ref ${reference}`);
  } else {
    const lead = method === 'gcash' ? 'Sent via GCash' : method === 'paymaya' ? 'Sent via Maya' : method === 'other' ? 'Received' : null;
    if (lead) parts.push(`${lead} ${money(payment.amount)}`);
    if (reference) parts.push(`Ref ${reference}`);
  }
  if (proof) {
    parts.push(<a key="proof" href={proof} target="_blank" rel="noopener noreferrer" className={LINK}>{method === 'other' ? 'View photo' : 'View screenshot'}</a>);
  }
  if (parts.length === 0) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ink-muted">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden>·</span>}
          <span>{part}</span>
        </React.Fragment>
      ))}
    </p>
  );
}
