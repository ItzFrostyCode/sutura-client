'use client';

import type { ServiceOrderState } from './useServiceOrder';

/** What happens after Place order, in the order it happens, so "how does production start?" is never a guess. */
export default function OrderNextSteps({ o }: Readonly<{ o: ServiceOrderState }>) {
  const payStep = o.policy === 'none'
    ? 'No deposit for this service: you pay when you pick it up.'
    : `${[
      'You pay',
      o.f.payFull || o.policy === 'full' ? 'in full' : `the ${o.depositPercent}% deposit`,
      o.f.payMethod === 'cash' ? 'in cash at the shop' : o.f.payMethod === 'gcash' ? 'by GCash and send the receipt from My Orders' : '',
    ].filter(Boolean).join(' ')}. The shop checks it.`;
  const steps = [
    { title: 'The shop reviews your order', text: o.quoted ? 'It sends the price for you to accept.' : 'It confirms the price, the rush and the finish date, or sends a new price for you to accept.' },
    { title: o.policy === 'none' ? 'Nothing to pay yet' : 'You pay', text: payStep },
    { title: 'Production starts', text: 'Follow every stage, from cutting to pickup, in My Orders.' },
    { title: 'Fitting and pickup', text: 'The shop texts you when it is ready.' },
  ];

  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white tabular-nums">{i + 1}</span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-ink">{s.title}</p>
            <p className="mobile-body-sm text-ink-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
