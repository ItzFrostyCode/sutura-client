import { Clock } from 'lucide-react';
import type { AllFilters } from './homeFilters';

interface HomeFilterBarProps {
  readonly value: AllFilters;
  readonly onChange: (value: AllFilters) => void;
}

const DISTANCES: { label: string; value: number | null }[] = [
  { label: 'Any distance', value: null }, { label: '2 km', value: 2 }, { label: '5 km', value: 5 }, { label: '10 km', value: 10 },
];

const chip = (on: boolean) =>
  `flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${
    on ? 'border-ink bg-ink font-semibold text-white' : 'border-line bg-surface text-ink hover:border-ink'
  }`;

/**
 * Two quick filters for "Shops near you": open right now (the thesis's real-time branch availability) and distance.
 * The garment is picked in "Browse by garment"; rating, price and district live in the search bar's Filters sheet.
 */
export default function HomeFilterBar({ value, onChange }: HomeFilterBarProps) {
  return (
    // Wraps instead of scrolling past the edge, so the chips start and end on the same margins as every section.
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter shops near you">
      <button type="button" aria-pressed={value.status === 'open'} onClick={() => onChange({ ...value, status: value.status === 'open' ? 'all' : 'open' })} className={chip(value.status === 'open')}>
        <Clock size={16} aria-hidden /> Open now
      </button>
      <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-line" />
      {DISTANCES.map((d) => (
        <button key={d.label} type="button" aria-pressed={value.radiusKm === d.value} onClick={() => onChange({ ...value, radiusKm: d.value })} className={chip(value.radiusKm === d.value)}>
          {d.label}
        </button>
      ))}
    </div>
  );
}
