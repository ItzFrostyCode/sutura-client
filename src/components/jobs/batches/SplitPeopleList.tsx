import React from 'react';
import type { Person, SplitPlan } from './useSplitPlan';

/** Each person, and where they go: stay in this order or move to a batch. */
export default function SplitPeopleList({ people, plan }: Readonly<{ people: Person[]; plan: SplitPlan }>) {
  const max = Math.min(people.length, 8);
  return (
    <ul className="divide-y divide-espresso/[0.06] rounded-lg border border-espresso/[0.08]">
      {people.map((p) => (
        <li key={p.index} className="flex min-h-14 items-center justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{p.name || `Person ${p.index + 1}`}</p>
            {p.detail && <p className="truncate text-xs text-ink-muted">{p.detail}</p>}
          </div>
          <select
            aria-label={`Where ${p.name || `person ${p.index + 1}`} goes`} value={plan.placeOf(p.index)} onChange={(e) => plan.move(p.index, Number(e.target.value))}
            className="h-11 shrink-0 rounded-lg border border-espresso/[0.12] bg-white px-2 text-base text-ink focus:border-taupe focus:outline-none sm:text-sm"
          >
            <option value={1}>Stays in this order</option>
            {Array.from({ length: max }, (_, k) => k + 2).map((b) => <option key={b} value={b}>Batch {b}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}
