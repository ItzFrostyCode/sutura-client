import React from 'react';
import { PLAIN_FIELD } from '@/components/shared/plainForm';
import { sizeRowKeys, type SizeCounts } from './quotationSizes';

interface QuotationSizeCountsProps {
  readonly counts: SizeCounts;
  readonly onChange: (size: string, value: string) => void;
  readonly sized: number;
  readonly pieces: number;
}

/** How many pieces of each standard size; the total has to match the pieces. */
export default function QuotationSizeCounts({ counts, onChange, sized, pieces }: QuotationSizeCountsProps) {
  const ok = sized === pieces;
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {sizeRowKeys(counts).map((size) => (
          <label key={size} className="text-[13px] text-ink-muted">{size}
            <input inputMode="numeric" value={counts[size] ?? ''} onChange={(e) => onChange(size, e.target.value)} placeholder="0" className={`${PLAIN_FIELD} mt-1 text-center font-normal`} />
          </label>
        ))}
      </div>
      <p className={`mt-2 text-[13px] ${ok ? 'text-sage' : 'text-amber-700'}`} aria-live="polite">{sized} of {pieces} pieces have a size</p>
    </div>
  );
}
