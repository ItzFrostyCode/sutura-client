import React from 'react';
import { PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';

interface QuotationExtrasProps {
  readonly validUntil: string;
  readonly setValidUntil: (v: string) => void;
  readonly notes: string;
  readonly setNotes: (v: string) => void;
}

/** The two optional fields of the Payment step, shown straight away. */
export default function QuotationExtras({ validUntil, setValidUntil, notes, setNotes }: QuotationExtrasProps) {
  return (
    <div className="space-y-4">
      <label className={`${PLAIN_LABEL} block`}>Note for the customer (optional)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} className={`${PLAIN_FIELD} mt-1.5 h-auto min-h-20 resize-none py-3 font-normal`} />
      </label>
      <div>
        <label className={PLAIN_LABEL}>Customer must answer by (optional)
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={`${PLAIN_FIELD} mt-1.5 font-normal`} />
        </label>
        <p className="text-[13px] text-ink-muted">After this date the customer is told to ask you for a new price.</p>
      </div>
    </div>
  );
}
