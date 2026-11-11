import type { ReactNode, Ref } from 'react';
import SuturaMark from '@/components/brand/SuturaMark';
import SearchPill from '@/components/home/SearchPill';
import { countAllFilters, type AllFilters } from '@/components/home/homeFilters';
import type { useSearchData } from '../hooks/useSearchData';
import SearchContextChips from './SearchContextChips';
import SearchScopeTabs from './SearchScopeTabs';

type SearchData = ReturnType<typeof useSearchData>;

interface SearchPanelTopProps {
  readonly s: SearchData;
  readonly onOpenFilter: () => void;
  readonly inputRef?: Ref<HTMLInputElement>;
  /** Kept for the callers that pass it; the address now lives in the top strip. */
  readonly compact?: boolean;
  /** Shops / Services / Designs tabs (phone and tablet hide them in Map view: the pins are shops). */
  readonly showTabs?: boolean;
  /** Sits right of the search bar (the List / Map switch on a phone or tablet). */
  readonly trailing?: ReactNode;
  /** Enter / the keyboard's Search key: on a phone or tablet this opens the list of results straight away. */
  readonly onSearch?: () => void;
  /** The search bar was tapped. */
  readonly onFocus?: () => void;
}

/** One full-width search bar with the filter icon inside it (Open / Closed is in the filter pop-up), and the category the person arrived with. */
export default function SearchPanelTop({ s, onOpenFilter, inputRef, showTabs = true, trailing, onSearch, onFocus }: SearchPanelTopProps) {
  const all: AllFilters = { radiusKm: s.radiusKm, status: s.openStatus, minPrice: s.minPrice, maxPrice: s.maxPrice, minRating: s.minRating, district: s.district, barangay: s.barangay, area: s.area, sortBy: s.sortBy };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
        <SearchPill
          slim
          value={s.q || s.categoryLabel}
          onChange={s.setQ}
          onSubmit={(e) => { e.preventDefault(); onSearch?.(); }}
          onOpenFilter={onOpenFilter}
          activeFilterCount={countAllFilters(all)}
          onClear={() => { s.setQ(''); s.setCategoryLabel(''); }}
          inputRef={inputRef}
          onFocus={onFocus}
          leading={(
            // The SUTURA logo in place of a magnifier: a mark only, not a button (home is the Discover tab / the header).
            <span aria-hidden className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center text-espresso">
              <SuturaMark detail="small" className="h-7 w-7" />
            </span>
          )}
        />
        </div>
        {trailing}
      </div>
      {/* Shops (default) / Designs / Services — what the search looks through. */}
      {showTabs && (
        <div className="mt-2">
          <SearchScopeTabs active={s.activeTab} onChange={s.handleTabChange} />
        </div>
      )}
      {/* Districts (All Davao … Tugbok) live in the Filter pop-up only — one place, and the space goes to the list and map. */}
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
