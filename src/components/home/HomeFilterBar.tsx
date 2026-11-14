import { Clock } from 'lucide-react';
import DistanceMenu, { type DistanceOption } from './DistanceMenu';
import type { AllFilters } from './homeFilters';

interface HomeFilterBarProps {
  readonly value: AllFilters;
  readonly onChange: (value: AllFilters) => void;
}

const DISTANCES: DistanceOption[] = [
  { label: 'Any distance', value: null }, { label: '2 km', value: 2 }, { label: '5 km', value: 5 }, { label: '10 km', value: 10 },
];

// No display class here: each chip sets its own (some are phone-only, some tablet-up).
const base = 'h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition-colors';
const chip = (on: boolean) =>
  `${base} ${on ? 'border-ink bg-ink font-semibold text-white' : 'border-line bg-surface text-ink hover:border-ink'}`;
// "Open now" uses the same green as the "Open" label on the shop cards.
const openChip = (on: boolean) =>
  `${base} ${on ? 'border-emerald-700 bg-emerald-700 font-semibold text-white' : 'border-line bg-surface text-ink hover:border-emerald-700'}`;

/**
 * Two quick filters for "Shops near you": open right now (the thesis's real-time branch availability) and distance.
 * Phone (320–599px): one row — "Open now" on the left, the distance menu on the right. From 600px: every distance as its own chip.
 * The garment is picked in "Browse by garment"; rating, price and district live in the search bar's Filters sheet.
 */
export default function HomeFilterBar({ value, onChange }: HomeFilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter shops near you">
      <button type="button" aria-pressed={value.status === 'open'} onClick={() => onChange({ ...value, status: value.status === 'open' ? 'all' : 'open' })} className={`flex ${openChip(value.status === 'open')}`}>
        <Clock size={16} aria-hidden className={value.status === 'open' ? '' : 'text-emerald-700'} /> Open now
      </button>

      {/* Phone: the distance menu sits on the right of the row. */}
      <DistanceMenu options={DISTANCES} value={value.radiusKm} onChange={(radiusKm) => onChange({ ...value, radiusKm })} className="ml-auto sm:hidden" />

      <span aria-hidden className="mx-1 hidden w-px shrink-0 self-stretch bg-line sm:block" />
      {DISTANCES.map((d) => (
        <button key={d.label} type="button" aria-pressed={value.radiusKm === d.value} onClick={() => onChange({ ...value, radiusKm: d.value })} className={`hidden sm:flex ${chip(value.radiusKm === d.value)}`}>
          {d.label}
        </button>
      ))}
    </div>
  );
}
