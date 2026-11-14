'use client';

import { peso } from '@/components/service-order/orderMath';
import type { GarmentWorkState } from './useGarmentWork';

function Line({ label, value, strong = false, muted = false }: Readonly<{ label: string; value: string; strong?: boolean; muted?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={`min-w-0 break-words ${strong ? 'text-base font-semibold text-ink' : 'mobile-body-sm text-ink-body'}`}>{label}</dt>
      <dd className={`shrink-0 whitespace-nowrap text-right tabular-nums ${strong ? 'text-xl font-bold text-ink' : muted ? 'mobile-body-sm text-ink-muted' : 'text-base text-ink'}`}>{value}</dd>
    </div>
  );
}

/**
 * The price like a POS receipt: one line per job picked, the total, then what is paid today and at pick-up.
 * Work on the customer's own garment is paid at pick-up; the shop confirms the price once it sees the garment.
 */
export default function GarmentWorkSummary({ w }: Readonly<{ w: GarmentWorkState }>) {
  const from = w.startingPrice ? 'from ' : '';
  return (
    <section aria-labelledby="work-summary" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h2 id="work-summary" className="mobile-h4 text-ink">Price</h2>
      {w.lines.length === 0 ? (
        <p className="mobile-body-sm mt-2 text-ink-muted">Pick what the shop should do to see the price.</p>
      ) : (
        <dl className="mt-1 divide-y divide-line">
          {w.lines.map((l) => <Line key={l.id} label={`1 × ${l.label}`} value={w.quoted ? 'Quoted' : `${from}${peso(Number(l.amount || 0))}`} />)}
          <Line label="Estimated total" value={w.quoted ? 'After the shop sees it' : `${from}${peso(w.subtotal)}`} strong />
          <Line label="Pay today" value={peso(0)} muted />
          {!w.quoted && <Line label="Pay at pick-up" value={`${from}${peso(w.subtotal)}`} />}
        </dl>
      )}
      <p className="mobile-caption mt-3 text-ink-muted">
        You bring the garment to the shop. They check it first; if it is different from what you wrote, you see the new price and choose before any work.
      </p>
    </section>
  );
}
