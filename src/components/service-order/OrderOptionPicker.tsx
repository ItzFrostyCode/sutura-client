'use client';

import { optionLine } from '@/lib/orderUnits';
import { ChoiceCard, SectionLabel, peso } from './orderUi';
import type { ServiceOrderState } from './useServiceOrder';

/**
 * The option comes first because it decides what is covered (so which sizes are asked) and what one ordered unit is.
 * A service with a single option has it implied and shows nothing here.
 */
export default function OrderOptionPicker({ o }: Readonly<{ o: ServiceOrderState }>) {
  if (o.pricing.length <= 1) return null;
  return (
    <fieldset className="space-y-2.5">
      <SectionLabel as="legend">Option</SectionLabel>
      <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Option">
        {o.pricing.map((p) => (
          <ChoiceCard
            key={p.id}
            selected={o.pricingId === p.id}
            onSelect={() => o.setPricingId(p.id)}
            label={p.label}
            detail={optionLine(p) || undefined}
            trailing={p.amount !== null && p.amount !== '' ? `${peso(Number(p.amount))}${p.sold_as === 'set' ? ' per set' : p.sold_as === 'garment' ? ' each' : ''}` : 'Quoted'}
          />
        ))}
      </div>
      {o.pricingId === null && <p className="mobile-caption text-ink-muted">Choose one to go on.</p>}
    </fieldset>
  );
}
