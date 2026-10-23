import React from 'react';
import { BTN_SM, PLAIN_LABEL } from '@/components/shared/plainForm';
import ChargeRows from './ChargeRows';
import PesoInput from './PesoInput';
import QuotationBreakdown from './QuotationBreakdown';
import { peso } from './readinessFormat';
import type { QuotationFormState } from './useQuotationForm';

interface QuotationPriceSectionProps {
  readonly f: QuotationFormState;
  readonly pieces: number;
}

/** Step 2: the price of one piece (starting from the service or design), what comes off or goes on, and the total. */
export default function QuotationPriceSection({ f, pieces }: QuotationPriceSectionProps) {
  const { basis } = f;
  const differs = basis.amount !== null && Math.abs(f.unit - basis.amount) > 0.004;
  return (
    <>
      <div>
        <label className={PLAIN_LABEL}>Price per piece
          <PesoInput value={f.unit} onChange={f.setUnit} className="mt-1.5 font-normal" />
        </label>
        {basis.amount !== null ? (
          <div className="flex flex-wrap items-center gap-x-3">
            <p className="text-[13px] text-ink-muted">From the {basis.source}: {peso(basis.amount)} each</p>
            {differs && <button type="button" onClick={() => f.setUnit(basis.amount ?? 0)} className="min-h-11 text-[13px] font-medium text-espresso underline-offset-2 hover:underline">Reset to {peso(basis.amount)}</button>}
          </div>
        ) : (
          <p className="text-[13px] text-ink-muted">This service is priced per order — type the price per piece.</p>
        )}
        <p className="text-sm font-medium text-ink">{peso(f.unit)} × {pieces} pcs = {peso(f.goods)}</p>
      </div>
      <div>
        <label className={PLAIN_LABEL}>Bulk discount (optional)
          <PesoInput value={f.discount} onChange={f.setDiscount} className="mt-1.5 font-normal" />
        </label>
        <p className="text-[13px] text-ink-muted">An amount you take off the whole order, e.g. for many pieces.</p>
      </div>
      <ChargeRows title="Extra charges" hint="e.g. embroidery, special lining, rush fee" rows={f.extras} onChange={f.setExtras} labelPlaceholder="e.g. Embroidery" />
      <ChargeRows title="Customer's own items" hint="They bring it, so you take it off the price (e.g. their own fabric)." rows={f.deductions} onChange={f.setDeductions} labelPlaceholder="e.g. Customer's fabric" />
      <QuotationBreakdown f={f} pieces={pieces} />
      {f.priceEdited && <button type="button" onClick={f.resetPrices} className={BTN_SM}>Undo my price changes</button>}
    </>
  );
}
