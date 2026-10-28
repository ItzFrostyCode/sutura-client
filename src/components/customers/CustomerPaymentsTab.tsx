'use client';

import Link from 'next/link';
import { ChevronRight, HandCoins } from 'lucide-react';
import type { JobOrder, OrderPayment } from './customerTypes';
import { amountOf, moneySummary, owingOrders, peso, stateOf } from './customerMoney';

interface Props {
  readonly jobs: JobOrder[];
  /** Owner and branch manager collect money; staff see the balances only. */
  readonly canCollect: boolean;
  /** Prefills the Job Balances search so "All balances" lands on this customer only. */
  readonly customerName?: string;
}

const STATE_STYLE = { verified: 'text-sage', pending: 'text-amber-700', rejected: 'text-danger' } as const;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/** What this customer owes and has paid, with a way to collect each balance on the order's own Payments tab. */
export default function CustomerPaymentsTab({ jobs, canCollect, customerName }: Props) {
  const { billed, paid, balance } = moneySummary(jobs);
  const owing = owingOrders(jobs);
  const received = jobs
    .flatMap((j) => (j.payments ?? []).map((p) => ({ p, order: j })))
    .sort((a, b) => b.p.created_at.localeCompare(a.p.created_at));

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-line bg-canvas/30">
        <h2 className="text-sm font-bold text-ink">Payments</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* One tile per figure: stacked on a phone (label left, the whole amount right), three across from 640px. The amount wraps, it is never cut to "…". */}
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          {[['Billed', billed, 'text-ink'], ['Paid', paid, 'text-sage'], ['Balance due', balance, balance > 0 ? 'text-danger' : 'text-ink']].map(([label, value, tone]) => (
            <div key={label as string} className="flex items-baseline justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3 sm:block">
              <dt className="shrink-0 text-xs font-medium text-ink-muted">{label as string}</dt>
              <dd className={`min-w-0 break-words text-right text-lg font-semibold tabular-nums sm:mt-1 sm:text-left sm:text-xl ${tone}`}>{peso(value as number)}</dd>
            </div>
          ))}
        </dl>

        <section aria-label="Orders with a balance">
          <h3 className="mb-1 text-sm font-bold text-ink">Waiting for payment</h3>
          {owing.length === 0 ? (
            <p className="py-3 text-sm text-ink-muted">Nothing owed. Every order is paid up.</p>
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
            <h3 className="text-sm font-bold text-ink">Payments received</h3>
            {canCollect && (
              <Link
                href={customerName ? `/dashboard/payments?tab=job_balances&q=${encodeURIComponent(customerName)}` : '/dashboard/payments?tab=job_balances'}
                className="flex items-center text-xs font-semibold text-taupe hover:underline"
              >
                All balances <ChevronRight size={13} />
              </Link>
            )}
          </div>
          {received.length === 0 ? (
            <p className="py-3 text-sm text-ink-muted">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {received.map(({ p, order }) => <PaymentRow key={p.id} payment={p} orderNumber={order.order_number} orderId={order.id} />)}
            </ul>
          )}
        </section>
      </div>
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
