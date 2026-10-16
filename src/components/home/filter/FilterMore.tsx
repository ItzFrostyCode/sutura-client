import type { MoreFilters } from '../homeFilters';
import { chip } from './filterUi';

interface FilterMoreProps {
  readonly value: MoreFilters;
  readonly onChange: (value: MoreFilters) => void;
}




const field = 'h-12 w-full min-w-0 rounded-2xl bg-sunken px-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong';
const label = 'mobile-caption mb-1.5 block text-ink-muted';
const title = 'mobile-h4 mb-3 text-ink';

/** Price (range and sort order) and rating. */
export default function FilterMore({ value, onChange }: FilterMoreProps) {
  const set = (patch: Partial<MoreFilters>) => onChange({ ...value, ...patch });

  return (
    <>
      <section className="mt-6">
        <h3 className={title}>Price</h3>

        {/* Sort order — always active, click to swap direction */}
        <button
          type="button"
          onClick={() => set({ sortBy: value.sortBy === 'price_asc' ? 'price_desc' : 'price_asc' })}
          className={`${chip(true)} w-full gap-2`}
        >
          {value.sortBy === 'price_desc' ? (
            <>↓ <span>High to Low</span></>
          ) : (
            <>↑ <span>Low to High</span></>
          )}
        </button>

        {/* Price range */}
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label className={label}>Min</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label="Minimum price"
              placeholder="₱ 0"
              value={value.minPrice}
              onChange={(e) => set({ minPrice: e.target.value })}
              className={field}
            />
          </div>
          <span className="mb-3 shrink-0 text-ink-muted">—</span>
          <div className="flex-1">
            <label className={label}>Max</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              aria-label="Maximum price"
              placeholder="₱ Any"
              value={value.maxPrice}
              onChange={(e) => set({ maxPrice: e.target.value })}
              className={field}
            />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h3 className={title}>Rating</h3>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const selected = Number(value.minRating) || 0;
            const filled = star <= selected;
            return (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star > 1 ? 's' : ''} and up`}
                onClick={() => set({ minRating: selected === star ? '' : String(star) })}
                className="flex h-11 w-11 items-center justify-center transition-transform active:scale-90"
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7 transition-colors" fill={filled ? '#FACC15' : 'none'} stroke={filled ? '#F59E0B' : '#d1c4b8'} strokeWidth={1.8}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            );
          })}
          {Number(value.minRating) > 0 && (
            <span className="mobile-body-sm ml-1 text-ink-muted">{value.minRating}★ &amp; up</span>
          )}
        </div>
        {!value.minRating && (
          <p className="mobile-caption mt-1 text-ink-muted">Tap a star to filter minimum rating</p>
        )}
      </section>
    </>
  );
}
