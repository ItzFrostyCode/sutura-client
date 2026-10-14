import type { Ref } from 'react';
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
}

/** Where I am, one full-width search bar with the filter icon inside it (Open / Closed is in the filter pop-up), and the category the person arrived with. */
export default function SearchPanelTop({ s, onOpenFilter, inputRef, compact }: SearchPanelTopProps) {
  const here = `/search${s.searchParams.toString() ? `?${s.searchParams.toString()}` : ''}`;
  const changeHref = `/location?returnTo=${encodeURIComponent(here)}`;
  const all: AllFilters = { radiusKm: s.radiusKm, status: s.openStatus, minPrice: s.minPrice, maxPrice: s.maxPrice, minRating: s.minRating, district: s.district, sortBy: s.sortBy };

  return (
    <div>
      <LocationLine location={s.savedLocation} changeHref={changeHref} compact={compact} small />
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
