import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import type { BatchSummary } from '@/components/jobs/batches/batchTypes';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

/** Your order was split because people pay at different times: which batch this is, and (signed in) the total for all of them. */
export default function OrderBatchesCard({ batch, signedIn }: Readonly<{ batch: BatchSummary; signedIn: boolean }>) {
  return (
    <div className="card-soft space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-taupe" />
        <p className="mobile-h4 text-ink">{batch.kind === 'set' ? 'Order' : 'Batch'} {batch.this_batch} of {batch.count}</p>
      </div>
      <p className="mobile-body-sm text-ink-body">{batch.kind === 'set' ? `You asked for ${batch.count} services at this visit. Each one is its own order, made and paid on its own.` : `Your order is in ${batch.count} batches. Each one is paid and ready on its own, so the first can be picked up before the others.`}</p>
      {signedIn && batch.orders.length > 1 && (
        <ul className="divide-y divide-line">
          {batch.orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="flex min-h-12 items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="mobile-body-sm block font-semibold text-ink">{batch.kind === 'set' ? (o.service_name ?? `Order ${o.batch_no}`) : `Batch ${o.batch_no} · ${o.people} ${o.people === 1 ? 'person' : 'people'}`}</span>
                  {o.paid_by_name && <span className="mobile-caption block text-ink-muted">Paid by {o.paid_by_name}</span>}
                </span>
                <span className="mobile-body-sm shrink-0 text-ink">{(o.balance ?? 0) > 0.005 ? `${peso(o.balance ?? 0)} to pay` : 'Paid'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {signedIn && batch.totals && (
        <p className="mobile-body-sm border-t border-line pt-3 text-ink">
          Your total for all of them: <strong>{peso(batch.totals.grand_total)}</strong> · still to pay <strong>{peso(batch.totals.balance)}</strong>
        </p>
      )}
    </div>
  );
}
