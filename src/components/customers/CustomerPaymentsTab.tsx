'use client';

import Link from 'next/link';
import { ChevronRight, HandCoins } from 'lucide-react';
import type { JobOrder, OrderPayment } from './customerTypes';
import { amountOf, moneySummary, owingOrders, peso, stateOf } from './customerMoney';

interface Props {
  readonly jobs: JobOrder[];
  /** Owner and branch manager collect money; staff see the balances only. */
  readonly canCollect: boolean;
}

const STATE_STYLE = { verified: 'text-sage', pending: 'text-amber-700', rejected: 'text-danger' } as const;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/** What this customer owes and has paid, with a way to collect each balance on the order's own Payments tab. */
export default function CustomerPaymentsTab({ jobs, canCollect }: Props) {
  const { billed, paid, balance } = moneySummary(jobs);
  const owing = owingOrders(jobs);
  const received = jobs
    .flatMap((j) => (j.payments ?? []).map((p) => ({ p, order: j })))
    .sort((a, b) => b.p.created_at.localeCompare(a.p.created_at));

  return (
    <div className="space-y-6 animate-fade-in">
      <dl className="grid grid-cols-3 gap-x-6 border-b border-line pb-4">
        {[['Billed', billed, 'text-ink'], ['Paid', paid, 'text-sage'], ['Balance due', balance, balance > 0 ? 'text-danger' : 'text-ink']].map(([label, value, tone]) => (
          <div key={label as string} className="min-w-0">
            <dd className={`truncate text-lg font-semibold sm:text-xl ${tone}`}>{peso(value as number)}</dd>
            <dt className="text-xs text-ink-muted">{label as string}</dt>
          </div>
        ))}
      </dl>

      <section aria-label="Orders with a balance">
        <h2 className="mb-1 text-sm font-bold text-ink">Waiting for payment</h2>
        {owing.length === 0 ? (
          <p className="py-4 text-sm text-ink-muted">Nothing owed. Every order is paid up.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {owing.map((j) => (
              <li key={j.id} className="flex min-h-14 items-center justify-between gap-3 py-2">
                <Link href={`/dashboard/jobs/${j.id}`} className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{j.order_number}</span>
                  <span className="block truncate text-xs text-ink-muted">{j.service?.name ?? 'Order'} · paid {peso(amountOf(j.total_amount) - amountOf(j.discount_amount) - amountOf(j.balance))} of {peso(amountOf(j.total_amount) - amountOf(j.discount_amount))}</span>
                </Link>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-danger">{peso(amountOf(j.balance))}</span>
                  {canCollect && (
                    <Link href={`/dashboard/jobs/${j.id}#payments`} className="flex h-10 items-center gap-1.5 bg-espresso px-3 text-xs font-bold text-white hover:bg-espresso/90">
                      <HandCoins size={14} /> Collect
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Payments received">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold text-ink">Payments received</h2>
          {canCollect && <Link href="/dashboard/payments?tab=job_balances" className="flex items-center text-xs font-semibold text-taupe hover:underline">All balances <ChevronRight size={13} /></Link>}
        </div>
        {received.length === 0 ? (
          <p className="py-4 text-sm text-ink-muted">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {received.map(({ p, order }) => <PaymentRow key={p.id} payment={p} orderNumber={order.order_number} orderId={order.id} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function PaymentRow({ payment: p, orderNumber, orderId }: Readonly<{ payment: OrderPayment; orderNumber: string; orderId: number }>) {
  const state = stateOf(p);
  return (
    <li className="flex min-h-12 items-center justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="block truncate text-sm text-ink">
          <Link href={`/dashboard/jobs/${orderId}`} className="font-semibold hover:underline">{orderNumber}</Link>
          <span className="text-ink-muted"> · {(p.payment_method ?? 'cash').replace('_', ' ')}</span>
        </span>
        <span className="block truncate text-xs text-ink-muted">{day(p.created_at)}{p.recorded_by ? ` · ${p.recorded_by.name}` : ''}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold text-ink">{peso(amountOf(p.amount))}</span>
        <span className={`block text-xs font-semibold capitalize ${STATE_STYLE[state]}`}>{state === 'pending' ? 'Waiting to be checked' : state}</span>
      </span>
    </li>
  );
}
