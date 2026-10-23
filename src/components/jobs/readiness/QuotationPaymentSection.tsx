import React from 'react';
import { PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import { peso } from './readinessFormat';

interface QuotationPaymentSectionProps {
  readonly policy: string;
  readonly setPolicy: (v: string) => void;
  readonly percent: number;
  readonly setPercent: (v: number) => void;
  readonly total: number;
  readonly deposit: number;
}

/** What the customer will pay, and when, in one sentence. */
export function paymentLine(policy: string, total: number, deposit: number): string {
  if (policy === 'deposit') return `Customer pays ${peso(deposit)} before work starts and ${peso(total - deposit)} at pick-up.`;
  if (policy === 'full') return `Customer pays ${peso(total)} before work starts.`;
  if (policy === 'none') return `Customer pays ${peso(total)} at pick-up.`;
  return '';
}

/** Group 3: when the customer pays. */
export default function QuotationPaymentSection({ policy, setPolicy, percent, setPercent, total, deposit }: QuotationPaymentSectionProps) {
  const line = paymentLine(policy, total, deposit);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={PLAIN_LABEL}>When the customer pays
          <select value={policy} onChange={(e) => setPolicy(e.target.value)} className={`${PLAIN_FIELD} mt-1.5 font-normal`}>
            <option value="deposit">Deposit first, the rest at pick-up</option>
            <option value="full">Full payment first</option>
            <option value="none">Pay at pick-up</option>
          </select>
        </label>
        {policy === 'deposit' && (
          <label className={PLAIN_LABEL}>Deposit (%)
            <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className={`${PLAIN_FIELD} mt-1.5 font-normal`} />
          </label>
        )}
      </div>
      <div className="space-y-1">
        {line && <p className="text-sm text-ink-body">{line}</p>}
        <p className="text-[13px] text-ink-muted">Locked once the customer agrees.</p>
      </div>
    </>
  );
}
