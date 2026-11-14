'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import OrderNextSteps from './OrderNextSteps';

/** After Place order: the order number and tracking code, what happens next, and where to follow it. */
export default function OrderPlaced({ o }: Readonly<{ o: ServiceOrderState }>) {
  const placed = o.placed!;
  return (
    <main className="mobile-screen-margins min-h-dvh bg-canvas py-10">
      <div className="mx-auto w-full max-w-xl space-y-8">
        <div className="text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-600" aria-hidden />
          <h1 className="mobile-h1 mt-4 text-ink">Order sent</h1>
          <p className="mobile-body-md mt-2 text-ink-muted">{o.store?.name} will review it and confirm the price. You paid nothing yet.</p>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
            <dt className="mobile-caption text-ink-muted">Order number</dt>
            <dd className="truncate text-lg font-semibold tabular-nums text-ink">{placed.order_number}</dd>
          </div>
          <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
            <dt className="mobile-caption text-ink-muted">Tracking code</dt>
            <dd className="truncate text-lg font-semibold tabular-nums text-ink">{placed.tracking_code}</dd>
          </div>
        </dl>

        <section aria-labelledby="placed-next">
          <h2 id="placed-next" className="mobile-h3 mb-3 text-ink">What happens next</h2>
          <OrderNextSteps o={o} />
        </section>

        <div className="flex flex-col gap-3 min-[481px]:flex-row">
          <Link href={`/account/orders/${placed.id}`} className="flex h-[52px] flex-1 items-center justify-center rounded-xl bg-ink px-4 text-base font-semibold text-white">
            Open my order
          </Link>
          <Link href={`/store/${o.storeId}`} className="flex h-[52px] flex-1 items-center justify-center rounded-xl border border-line px-4 text-base font-semibold text-ink">
            Back to the shop
          </Link>
        </div>
      </div>
    </main>
  );
}
