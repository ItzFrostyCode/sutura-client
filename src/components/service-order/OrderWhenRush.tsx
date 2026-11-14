'use client';

import { Zap } from 'lucide-react';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import type { ServiceOrderState } from './useServiceOrder';
import { INPUT, Optional, SectionLabel, Tip, peso } from './orderUi';
import { percent } from './orderMath';

const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** When the customer needs it, how long this service usually takes, and rush with its exact price. */
export default function OrderWhenRush({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const min = o.service?.estimated_days ?? null;
  const max = o.service?.estimated_days_max ?? null;
  const today = manilaToday();
  const tomorrow = new Date(Date.parse(today) + 86_400_000).toISOString().slice(0, 10);
  const days = f.neededBy ? daysBetween(today, f.neededBy) : null;
  const tooSoon = min !== null && days !== null && days < min;
  const rushPrice = o.money.rushFee !== null && o.money.rushFee > 0 ? `+${peso(o.money.rushFee)}`
    : o.quoted ? `+${percent(o.rushPercent)} of the quoted price` : `+${percent(o.rushPercent)}`;
  // How rush is charged, in one line: per piece, or a share of the price (and what that is per piece).
  const rushHow = o.rushPerPiece !== null
    ? `${peso(o.rushPerPiece)} for every piece${o.pieces > 1 ? ` (× ${o.pieces})` : ''}.`
    : o.money.rushFee !== null && o.money.rushFee > 0 && o.pieces > 0
      ? `${percent(o.rushPercent)} of the price: ${peso(o.money.rushFee / o.pieces)} per piece.`
      : `${percent(o.rushPercent)} of the price.`;

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel htmlFor="order-needed" hint={min !== null ? `This service usually takes ${formatServiceTurnaround(min, max)}.` : 'The shop confirms the finish date when it accepts your order.'}>
          When do you need it?<Optional />
        </SectionLabel>
        <input id="order-needed" type="date" min={tomorrow} value={f.neededBy} onChange={(e) => f.setNeededBy(e.target.value)} className={`${INPUT} min-[481px]:max-w-xs`} />
        {tooSoon && !f.rush && o.rushAvailable && (
          <p className="mobile-body-sm mt-2 text-amber-800">That is {days} day{days === 1 ? '' : 's'} away, sooner than this service usually takes. Turn on Rush below.</p>
        )}
      </div>

      {o.rushAvailable ? (
        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${f.rush ? 'border-ink ring-1 ring-ink' : 'border-line'} bg-surface`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${f.rush ? 'bg-ink text-white' : 'bg-sunken text-ink-muted'}`}><Zap size={18} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-ink">Rush order</span>
            <span className="mobile-body-sm block text-ink-muted">Made ahead of the usual queue. {rushHow}</span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-base font-semibold tabular-nums text-ink">{rushPrice}</span>
          <input type="checkbox" checked={f.rush} onChange={(e) => f.setRush(e.target.checked)} className="sr-only" aria-label="Rush order" />
          <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${f.rush ? 'bg-ink' : 'bg-line-strong'}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-xs transition-transform ${f.rush ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </span>
        </label>
      ) : (
        <Tip>This shop does not take rush orders.</Tip>
      )}
    </div>
  );
}
