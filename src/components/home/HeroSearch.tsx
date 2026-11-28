import { Search, SlidersHorizontal } from 'lucide-react';

interface HeroSearchProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onOpenFilter: () => void;
  readonly activeFilterCount: number;
}

/** The one placeholder line, used here and in the search bar of the map, at every screen size. It names garments, not
 * "what do you need?", because the thesis's discovery objective is search by garment type. Kept short for a 320px phone. */
export const SEARCH_PLACEHOLDER = 'Barong, uniform, gown…';

/**
 * Search box with the filter icon and its own Search button (the pill on the search screen has no button).
 * Built the same at every size so a phone and a laptop show one design: [what you type] [filters] [magnifier].
 * The magnifier appears once, as the button (no word, no second icon), which also leaves the line you type its room.
 */
export default function HeroSearch({ value, onChange, onSubmit, onOpenFilter, activeFilterCount }: HeroSearchProps) {
  return (
    <form onSubmit={onSubmit} role="search" className="flex h-14 overflow-hidden rounded-xl bg-surface shadow-lg focus-within:ring-2 focus-within:ring-amber-300">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label="Search garments, services or shops"
        className="h-full w-full min-w-0 flex-1 bg-transparent pl-5 pr-2 text-lg text-ink placeholder:text-ink-muted focus:outline-none"
      />
      <button
        type="button"
        onClick={onOpenFilter}
        aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : 'Filters'}
        className="touch-target-44 relative flex w-12 shrink-0 items-center justify-center border-l border-line text-ink transition-colors hover:text-taupe"
      >
        <SlidersHorizontal size={20} />
        {activeFilterCount > 0 && <span className="absolute right-2.5 top-3 h-2.5 w-2.5 rounded-full bg-taupe" />}
      </button>
      <button type="submit" aria-label="Search" className="flex w-14 shrink-0 items-center justify-center bg-ink text-white transition-colors hover:bg-taupe sm:w-16">
        <Search size={22} aria-hidden />
      </button>
    </form>
  );
}
