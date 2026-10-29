import { Search, SlidersHorizontal } from 'lucide-react';

interface HeroSearchProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onOpenFilter: () => void;
  readonly activeFilterCount: number;
}

/** Search box with the filter icon and its own Search button (the pill on the search screen has no button). */
export default function HeroSearch({ value, onChange, onSubmit, onOpenFilter, activeFilterCount }: HeroSearchProps) {
  return (
    <form onSubmit={onSubmit} role="search" className="flex h-14 overflow-hidden rounded-xl bg-surface shadow-lg">
      <Search size={22} className="my-auto ml-4 shrink-0 text-ink-faint" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What are you looking for?"
        aria-label="Search garments, services or shops"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-ink placeholder:text-ink-faint focus:outline-none"
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
      <button type="submit" className="shrink-0 bg-ink px-5 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-taupe sm:px-8">Search</button>
    </form>
  );
}
