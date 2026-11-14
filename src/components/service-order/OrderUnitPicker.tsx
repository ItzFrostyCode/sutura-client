'use client';

import { useState } from 'react';
import type { OrderForm } from './useOrderForm';
import { Segments, SectionLabel } from './orderUi';
import { UNIT_LABEL, type Unit } from './orderPoints';

const OPTIONS: readonly { value: Unit; label: string }[] = [
  { value: 'in', label: UNIT_LABEL.in }, { value: 'cm', label: UNIT_LABEL.cm },
];

/**
 * "Measure in": chosen once, before any number is typed, and shown inside every field after. Numbers are never
 * converted: switching after typing asks first, then clears them so a number can never be read in the wrong unit.
 */
export default function OrderUnitPicker({ f }: Readonly<{ f: OrderForm }>) {
  const [pending, setPending] = useState<Unit | null>(null);
  const choose = (u: Unit) => {
    if (u === f.unit) return;
    if (f.unit && f.hasNumbers) setPending(u);
    else f.setUnit(u);
  };

  return (
    <div>
      <SectionLabel as="p" hint="Use one unit for every measurement.">Measure in</SectionLabel>
      <Segments label="Measure in" value={f.unit} onChange={choose} options={OPTIONS} />
      {pending && (
        <div role="alertdialog" aria-label="Switch unit" className="mt-3 rounded-xl border border-line bg-surface p-4">
          <p className="mobile-body-sm text-ink">
            Switch to {UNIT_LABEL[pending].toLowerCase()}? The numbers you typed are in {UNIT_LABEL[f.unit as Unit].toLowerCase()}, so they will be cleared.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={() => setPending(null)} className="h-11 flex-1 rounded-xl border border-line px-4 text-sm font-semibold text-ink">
              Keep {UNIT_LABEL[f.unit as Unit].toLowerCase()}
            </button>
            <button type="button" onClick={() => { f.setUnit(pending); setPending(null); }} className="h-11 flex-1 rounded-xl bg-ink px-4 text-sm font-semibold text-white">
              Switch and clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
