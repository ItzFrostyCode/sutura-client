import { DISTRICTS } from '@/components/search/types';
import type { MoreFilters } from '../homeFilters';
import { chip } from './filterUi';

interface FilterMoreProps {
  readonly value: MoreFilters;
  readonly onChange: (value: MoreFilters) => void;
}

const RATINGS = [{ v: '', t: 'Any' }, { v: '3', t: '3 & up' }, { v: '4', t: '4 & up' }, { v: '5', t: '5 only' }];
const SORTS = [{ v: 'price_asc', t: 'Low to high' }, { v: 'price_desc', t: 'High to low' }];
const field = 'h-12 min-w-0 flex-1 rounded-2xl bg-sunken px-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong';
const title = 'mobile-h4 mb-3 text-ink';

/** Price (range and order), rating and district. */
export default function FilterMore({ value, onChange }: FilterMoreProps) {
  const set = (patch: Partial<MoreFilters>) => onChange({ ...value, ...patch });

  return (
    <>
      <section className="mt-6">
        <h3 className={title}>Price</h3>
        <div className="flex gap-3">
          <input type="number" inputMode="numeric" min={0} aria-label="Lowest price" placeholder="₱ Min" value={value.minPrice} onChange={(e) => set({ minPrice: e.target.value })} className={field} />
          <input type="number" inputMode="numeric" min={0} aria-label="Highest price" placeholder="₱ Max" value={value.maxPrice} onChange={(e) => set({ maxPrice: e.target.value })} className={field} />
        </div>
        <div className="mt-3 flex gap-3">
          {SORTS.map(({ v, t }) => (
            <button key={v} type="button" aria-pressed={value.sortBy === v} onClick={() => set({ sortBy: value.sortBy === v ? '' : v })} className={`${chip(value.sortBy === v)} flex-1`}>{t}</button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className={title}>Rating</h3>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map(({ v, t }) => (
            <button key={t} type="button" aria-pressed={value.minRating === v} onClick={() => set({ minRating: v })} className={chip(value.minRating === v)}>{t}</button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className={title}>District</h3>
        <div className="flex flex-wrap gap-2">
          {['', ...DISTRICTS].map((d) => (
            <button key={d || 'all'} type="button" aria-pressed={value.district === d} onClick={() => set({ district: d })} className={chip(value.district === d)}>{d || 'All'}</button>
          ))}
        </div>
      </section>
    </>
  );
}
