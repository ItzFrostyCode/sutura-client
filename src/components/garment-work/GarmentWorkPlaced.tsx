'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { GarmentWorkState } from './useGarmentWork';

const NEXT = [
  { title: 'Bring the garment', text: 'Drop it off at the shop and show your order number. The address and hours are on your order page.' },
  { title: 'The shop checks it', text: 'If it is different from what you wrote, you see the new price on your order page and choose. Nothing is done until you agree.' },
  { title: 'Pick it up and pay', text: 'You get a message when it is ready. You pay at pick-up.' },
];

/** After the request is sent: the numbers to keep, the three things that happen next, and where to follow it. */
export default function GarmentWorkPlaced({ w }: Readonly<{ w: GarmentWorkState }>) {
  const p = w.placed!;
  return (
    <main className="mobile-screen-margins min-h-dvh bg-canvas py-10">
      <div className="mx-auto w-full max-w-xl space-y-8">
        <div className="text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-600" aria-hidden />
          <h1 className="mobile-h1 mt-4 text-ink">{w.copy.sentTitle}</h1>
          <p className="mobile-body-md mt-2 text-ink-muted">{w.storeName || 'The shop'} will review it. You paid nothing yet.</p>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          {[['Order number', p.order_number], ['Tracking code', p.tracking_code]].map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-2xl border border-line bg-surface p-4">
              <dt className="mobile-caption text-ink-muted">{k}</dt>
              <dd className="truncate text-lg font-semibold tabular-nums text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="work-next">
          <h2 id="work-next" className="mobile-h3 mb-3 text-ink">What happens next</h2>
          <ol className="space-y-3">
            {NEXT.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink">{i + 1}</span>
                <div className="min-w-0">
                  <p className="mobile-h4 text-ink">{s.title}</p>
                  <p className="mobile-body-sm text-ink-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex flex-col gap-3 min-[481px]:flex-row">
          <Link href={`/account/orders/${p.id}`} className="flex h-[52px] flex-1 items-center justify-center rounded-xl bg-ink px-4 text-base font-semibold text-white">Open my order</Link>
          <Link href={`/store/${w.storeId}`} className="flex h-[52px] flex-1 items-center justify-center rounded-xl border border-line px-4 text-base font-semibold text-ink">Back to the shop</Link>
        </div>
      </div>
    </main>
  );
}
