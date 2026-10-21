import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import type { BatchSummary } from './batchTypes';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** The other parts of a split order and the overall figures. The figures are worked out from the parts every time. */
export default function BatchSummaryCard({ batch, currentId }: Readonly<{ batch: BatchSummary; currentId: number }>) {
  const money = !!batch.totals;
  const set = batch.kind === 'set';
  return (
    <section className="rounded-xl border border-espresso/[0.08] bg-white" aria-label="All batches of this order">
      <header className="flex items-center gap-2 border-b border-espresso/[0.06] px-4 py-3">
        <Layers size={16} className="text-taupe" />
        <h3 className="text-sm font-semibold text-ink">{set ? `All ${batch.count} orders for this visit` : `All ${batch.count} batches`}</h3>
        <p className="ml-auto text-xs text-ink-muted">{set ? 'Different services, made and paid separately' : 'Same design, paid separately'}</p>
      </header>
      <ul className="divide-y divide-espresso/[0.06]">
        {batch.orders.map((o) => (
          <li key={o.id} className={o.id === currentId ? 'bg-taupe/5' : ''}>
            <Link href={`/dashboard/jobs/${o.id}`} className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-4 py-2.5 hover:bg-espresso/[0.03]">
              <span className="min-w-0 text-sm font-semibold text-ink">{set ? (o.service_name ?? `Order ${o.batch_no}`) : `Batch ${o.batch_no}`} · {o.order_number}{o.id === currentId && <span className="ml-2 text-xs font-normal text-ink-muted">this one</span>}</span>
              {money ? <span className="text-right text-sm text-ink">{o.balance && o.balance > 0.005 ? `${peso(o.balance)} due` : <span className="text-sage">Paid</span>}</span> : <span />}
              <span className="truncate text-xs text-ink-muted">{set ? `Order ${o.batch_no} of ${batch.count}` : `${o.people} ${o.people === 1 ? 'person' : 'people'}${o.paid_by_name ? ` · paid by ${o.paid_by_name}` : ''}`}</span>
              {money && o.total_amount !== undefined ? <span className="text-right text-xs text-ink-muted">of {peso(o.total_amount - (o.discount_amount ?? 0))}</span> : <span />}
            </Link>
          </li>
        ))}
      </ul>
      {batch.totals && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-espresso/[0.08] px-4 py-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-ink-muted">Total</dt><dd className="font-medium text-ink">{peso(batch.totals.total)}</dd></div>
          <div><dt className="text-xs text-ink-muted">Discount</dt><dd className="font-medium text-ink">{batch.totals.discount > 0 ? `−${peso(batch.totals.discount)}` : '—'}</dd></div>
          <div><dt className="text-xs text-ink-muted">Paid</dt><dd className="font-medium text-sage">{peso(batch.totals.paid)}</dd></div>
          <div><dt className="text-xs text-ink-muted">Balance of all</dt><dd className="font-semibold text-ink">{peso(batch.totals.balance)}</dd></div>
        </dl>
      )}
    </section>
  );
}
