import type { Ref } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SearchPill from '@/components/home/SearchPill';
import { countAllFilters, type AllFilters } from '@/components/home/homeFilters';
import type { useSearchData } from '../hooks/useSearchData';
import SearchContextChips from './SearchContextChips';

type SearchData = ReturnType<typeof useSearchData>;

interface SearchPanelTopProps {
  readonly s: SearchData;
  readonly onOpenFilter: () => void;
  readonly inputRef?: Ref<HTMLInputElement>;
  /** Kept for the callers that pass it; the address now lives in the top strip. */
  readonly compact?: boolean;
  readonly isExpanded?: boolean;
  readonly onToggleExpand?: () => void;
}

/** One full-width search bar with the filter icon inside it (Open / Closed is in the filter pop-up), and the category the person arrived with. */
export default function SearchPanelTop({ s, onOpenFilter, inputRef, isExpanded, onToggleExpand }: SearchPanelTopProps) {
  const all: AllFilters = { radiusKm: s.radiusKm, status: s.openStatus, minPrice: s.minPrice, maxPrice: s.maxPrice, minRating: s.minRating, district: s.district, barangay: s.barangay, area: s.area, sortBy: s.sortBy };

  return (
    <div>
      {/* Phone and tablet only: on desktop the card stays one size. */}
      {onToggleExpand && (
        <div className="mb-1 flex justify-end lg:hidden">
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Collapse panel down' : 'Expand panel up'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-sunken active:opacity-70 transition-colors"
            title={isExpanded ? 'Slide down' : 'Expand full'}
          >
            {isExpanded ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
          </button>
        </div>
      )}
      <div>
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
