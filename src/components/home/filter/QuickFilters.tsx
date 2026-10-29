import { Clock, Star } from 'lucide-react';
import type { MoreFilters, NearFilters } from '../homeFilters';
import { barChip } from './filterUi';

type Value = NearFilters & MoreFilters;

interface QuickFiltersProps {
  readonly value: Value;
  readonly onChange: (value: Value) => void;
}

const RATINGS = [{ label: 'Any', value: '' }, { label: '4+', value: '4' }, { label: '3+', value: '3' }];
const DISTANCES: { label: string; value: number | null }[] = [
  { label: 'Any', value: null }, { label: '2 km', value: 2 }, { label: '5 km', value: 5 }, { label: '10 km', value: 10 }, { label: '20 km', value: 20 },
];

/** Label beside its chips on a phone and tablet (one scrolling row); above them from 1024px. */
const group = 'flex shrink-0 items-center gap-2 lg:block';
const label = 'mobile-overline shrink-0 text-ink-muted lg:mb-1.5 lg:block';

/** Open now, rating and distance in one tap each; the Filters sheet keeps price and district. */
export default function QuickFilters({ value, onChange }: QuickFiltersProps) {
  return (
    <div className="-mx-3 flex items-center gap-4 overflow-x-auto px-3 hide-scrollbar sm:-mx-4 sm:px-4 lg:mx-0 lg:flex-wrap lg:items-end lg:gap-x-6 lg:gap-y-4 lg:overflow-visible lg:px-0">
      <div className={group}>
        <span className={label}>Availability</span>
        <button
          type="button"
          aria-pressed={value.status === 'open'}
          onClick={() => onChange({ ...value, status: value.status === 'open' ? 'all' : 'open' })}
          className={`${barChip(value.status === 'open')} gap-2`}
        >
          <Clock size={14} /> Open now
        </button>
      </div>
      <div className={group}>
        <span className={label}>Rating</span>
        <div role="group" aria-label="Rating" className="flex gap-1.5 lg:gap-2">
          {RATINGS.map((r) => (
            <button key={r.label} type="button" aria-pressed={value.minRating === r.value} onClick={() => onChange({ ...value, minRating: r.value })} className={`${barChip(value.minRating === r.value)} gap-1`}>
              {r.label}{r.value && <Star size={14} className="fill-current" />}
            </button>
          ))}
        </div>
      </div>
      <div className={`${group} min-w-0 max-w-full`}>
        <span className={label}>Within</span>
        <div role="group" aria-label="Distance" className="flex gap-1.5 lg:gap-2">
          {DISTANCES.map((d) => (
            <button key={d.label} type="button" aria-pressed={value.radiusKm === d.value} onClick={() => onChange({ ...value, radiusKm: d.value })} className={barChip(value.radiusKm === d.value)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
