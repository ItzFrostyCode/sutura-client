import type { Ref } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import LocationLine from '@/components/home/LocationLine';
import SearchPill from '@/components/home/SearchPill';
import { countAllFilters, type AllFilters } from '@/components/home/homeFilters';
import type { useSearchData } from '../hooks/useSearchData';
import SearchContextChips from './SearchContextChips';

type SearchData = ReturnType<typeof useSearchData>;

interface SearchPanelTopProps {
  readonly s: SearchData;
  readonly onOpenFilter: () => void;
  readonly inputRef?: Ref<HTMLInputElement>;
  /** One-line address, for the sheet on a phone or tablet. */
  readonly compact?: boolean;
  readonly isExpanded?: boolean;
  readonly onToggleExpand?: () => void;
}

/** Where I am, one full-width search bar with the filter icon inside it (Open / Closed is in the filter pop-up), and the category the person arrived with. */
export default function SearchPanelTop({ s, onOpenFilter, inputRef, compact, isExpanded, onToggleExpand }: SearchPanelTopProps) {
  const here = `/search${s.searchParams.toString() ? `?${s.searchParams.toString()}` : ''}`;
  const changeHref = `/location?returnTo=${encodeURIComponent(here)}`;
  const all: AllFilters = { radiusKm: s.radiusKm, status: s.openStatus, minPrice: s.minPrice, maxPrice: s.maxPrice, minRating: s.minRating, district: s.district, barangay: s.barangay, area: s.area, sortBy: s.sortBy };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <LocationLine location={s.savedLocation} changeHref={changeHref} compact={compact} small />
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken active:opacity-70"
          >
            {isExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        )}
      </div>
      <div className="mt-2">
        <SearchPill
          slim
          value={s.q || s.categoryLabel}
          onChange={s.setQ}
          onSubmit={(e) => e.preventDefault()}
          onOpenFilter={onOpenFilter}
          activeFilterCount={countAllFilters(all)}
          onClear={() => { s.setQ(''); s.setCategoryLabel(''); }}
          inputRef={inputRef}
        />
      </div>
      <div className="mt-2 empty:hidden">
        <SearchContextChips
          department={s.department}
          subcategory={s.subcategory}
          garmentType={s.garmentType}
          serviceCategory={s.serviceCategory}
          serviceType={s.serviceType}
          onClear={s.clearContext}
        />
      </div>
    </div>
  );
}
