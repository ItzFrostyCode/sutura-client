import type { MoreFilters } from '../homeFilters';
import DistrictChips from './DistrictChips';

interface FilterMoreProps {
  readonly value: MoreFilters;
  readonly onChange: (value: MoreFilters) => void;
}

const field = 'h-12 w-full min-w-0 rounded-2xl bg-sunken px-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong';
const label = 'mb-1.5 block text-xs text-ink-muted';
const title = 'mobile-h4 mb-3 text-ink';

/** District, price (range and sort order) and rating. */
export default function FilterMore({ value, onChange }: FilterMoreProps) {
  const set = (patch: Partial<MoreFilters>) => onChange({ ...value, ...patch });

  return (
    <>
      <section className="mt-6">
        <h3 className={title}>District</h3>
        {/* A new district drops the barangay / street picked inside the old one. */}
        <DistrictChips value={value.district} onChange={(district) => set({ district, barangay: '', area: '' })} />
      </section>

      <section className="mt-6">
        <h3 className={title}>Price</h3>

        {/* Sort order: a setting you flip, so it is outlined and says "Sort", not a black button that looks like an action. */}
        <button
          type="button"
          onClick={() => set({ sortBy: value.sortBy === 'price_asc' ? 'price_desc' : 'price_asc' })}
          aria-label={`Sort by price: ${value.sortBy === 'price_desc' ? 'high to low' : 'low to high'}. Tap to switch.`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-sm text-ink transition-colors hover:border-ink"
        >
          <span className="text-ink-muted">Sort:</span>
          <span className="font-semibold">{value.sortBy === 'price_desc' ? 'High to Low ↓' : 'Low to High ↑'}</span>
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
          <p className="mt-1 text-xs text-ink-muted">Tap a star to show shops rated that or higher</p>
        )}
      </section>
    </>
  );
}
