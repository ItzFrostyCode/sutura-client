'use client';

import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, SectionLabel, peso } from './orderUi';

/**
 * How the customer will pay once the shop confirms the price. Nothing is paid now: SUTURA records the payment, the
 * money goes straight to the shop (GCash, with the receipt sent from My Orders, or cash at the counter).
 */
export default function OrderPaymentChoice({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const gcash = o.data.methods.some((m) => m.kind === 'gcash');
  const due = o.money;
  const amount = (n: number | null) => (n !== null ? peso(n) : undefined);
  const depositNow = o.policy !== 'none' && o.policy !== 'full';
  const fullTotal = due.total;
  const depositAmount = due.total !== null ? Math.round(due.total * o.depositPercent) / 100 : null;

  return (
    <div className="space-y-6">
      {depositNow && (
        <fieldset>
          <SectionLabel as="legend" hint="Paid after the shop confirms the price, before work starts.">Before production</SectionLabel>
          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="How much before production">
            <ChoiceCard selected={!f.payFull} onSelect={() => f.setPayFull(false)} label={`Pay a ${o.depositPercent}% deposit`}
              detail="Pay the rest when you pick it up." trailing={amount(depositAmount)} />
            <ChoiceCard selected={f.payFull} onSelect={() => f.setPayFull(true)} label="Pay in full" detail="Nothing left to pay at pickup." trailing={amount(fullTotal)} />
          </div>
        </fieldset>
      )}
      {o.policy === 'none' && <p className="mobile-body-sm rounded-xl bg-sunken px-4 py-3 text-ink-body">No deposit for this service: you pay when you pick it up.</p>}
      {o.policy === 'full' && <p className="mobile-body-sm rounded-xl bg-sunken px-4 py-3 text-ink-body">This service is paid in full before work starts.</p>}

      <fieldset>
        <SectionLabel as="legend" hint="You choose now; you pay only after the shop confirms the price.">How you&apos;ll pay</SectionLabel>
        <div className="grid grid-cols-1 gap-2 min-[481px]:grid-cols-2" role="radiogroup" aria-label="How you will pay">
          <ChoiceCard selected={f.payMethod === 'gcash'} onSelect={() => f.setPayMethod('gcash')} disabled={!gcash}
            label="GCash" detail={gcash ? 'Send the receipt from My Orders.' : 'This shop has no GCash yet.'} />
          <ChoiceCard selected={f.payMethod === 'cash'} onSelect={() => f.setPayMethod('cash')} label="Cash at the shop" detail="Pay at the counter." />
        </div>
      </fieldset>
    </div>
  );
}
