'use client';

import { BULK_SIZES, type ServiceOrderState } from './useServiceOrder';
import { SectionLabel } from './orderUi';

const INPUT = 'w-full h-[48px] bg-canvas border border-line rounded-none px-3 text-base text-ink tabular-nums focus:outline-none focus:border-taupe placeholder:text-ink-faint';

function Counts({ o, title, value, onChange }: Readonly<{ o: ServiceOrderState; title: string; value: Record<string, string>; onChange: (next: Record<string, string>) => void }>) {
  return (
    <div className="space-y-2.5">
      <SectionLabel as="p">{title}</SectionLabel>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {BULK_SIZES.map((s) => (
          <div key={s}>
            <label htmlFor={`${title}-${s}`} className="block text-center text-xs font-semibold text-ink-body mb-1">{s}</label>
            <input id={`${title}-${s}`} type="number" inputMode="numeric" min="0" max="500" value={value[s] ?? ''} placeholder="0" className={`${INPUT} text-center px-1`}
              onChange={(e) => onChange({ ...value, [s]: e.target.value.replace(/\D/g, '') })} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A batch: team name, then how many of each size. For top & bottom, a count per top size and a count per bottom size that add up to the same number of sets. */
export default function OrderBulkSizes({ o }: Readonly<{ o: ServiceOrderState }>) {
  const both = o.measurementsNeeded && o.area === 'both';
  const mismatch = both && o.bulkBottomPieces !== o.bulkPieces;
  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <SectionLabel htmlFor="order-team">Team / organization name <span className="text-ink-faint font-normal">(Optional)</span></SectionLabel>
        <input id="order-team" type="text" maxLength={255} value={o.teamName} onChange={(e) => o.setTeamName(e.target.value)} placeholder="e.g. Barangay San Antonio Youth Basketball" className={INPUT.replace('px-3', 'px-4')} />
      </div>
      <Counts o={o} title={both ? 'Pieces per top size' : 'Pieces per size'} value={o.sizeBreakdown} onChange={o.setSizeBreakdown} />
      {both && <Counts o={o} title="Pieces per bottom size" value={o.sizeBreakdownBottom} onChange={o.setSizeBreakdownBottom} />}
      <p className={`text-sm tabular-nums ${(o.bulkPieces > 0 && o.bulkPieces < o.minQty) || mismatch ? 'text-danger' : 'text-ink-muted'}`}>
        {o.bulkPieces} {both ? (o.bulkPieces === 1 ? 'set' : 'sets') : o.bulkPieces === 1 ? 'piece' : 'pieces'} total
        {o.minQty > 1 && ` · this shop's minimum is ${o.minQty}`}
        {mismatch && ` · the bottoms add up to ${o.bulkBottomPieces}: they must match the tops`}
      </p>
    </div>
  );
}
