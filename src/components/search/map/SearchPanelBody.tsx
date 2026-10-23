import type { Ref } from 'react';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import { haversineKm } from '@/lib/customerLocation';
import type { useSearchData } from '../hooks/useSearchData';
import SearchPanelTop from './SearchPanelTop';
import SearchResults from './SearchResults';
import ShopDetail from './ShopDetail';

type SearchData = ReturnType<typeof useSearchData>;

interface SearchPanelBodyProps {
  readonly s: SearchData;
  readonly onOpenFilter: () => void;
  readonly onShowOnMap: (slug: string, path?: string) => boolean;
  /** The shop whose pin is selected: when there is one, the panel shows it instead of the list. */
  readonly selected: DiscoveryMapBranch | null;
  /** A page of the open shop to show instead of its storefront (e.g. "/service/3"). */
  readonly shopPath?: string | null;
  readonly onBack: () => void;
  readonly inputRef?: Ref<HTMLInputElement>;
  readonly compact?: boolean;
  /** Whether the bottom sheet is currently at full height. Passed to ShopDetail for its expand button. */
  readonly isExpanded?: boolean;
  /** Toggle the sheet between half and full snap. */
  readonly onToggleExpand?: () => void;
  readonly onSelectBranch?: (branch: DiscoveryMapBranch) => void;
}

/**
 * What goes inside the panel: the search and the shops, or one shop opened. The list stays mounted (just hidden) while a
 * shop is open, so going back returns to the same place in it — there is a single level, so one Back is always enough.
 */
export default function SearchPanelBody({
  s,
  onOpenFilter,
  onShowOnMap,
  selected,
  shopPath = null,
  onBack,
  inputRef,
  compact,
  isExpanded,
  onToggleExpand,
  onSelectBranch,
}: SearchPanelBodyProps) {
  const store = selected ? s.stores.find((st) => st.slug === selected.storeSlug) : undefined;
  const detail = Boolean(selected && store);

  // Straight-line distance from the user to the open branch
  const km =
    selected && s.userCoords
      ? haversineKm(s.userCoords.lat, s.userCoords.lng, selected.latitude, selected.longitude)
      : null;

  return (
    <>
      <div className={detail ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
        <div className={`shrink-0 px-3 pb-1 ${compact ? 'pt-2' : 'pt-4'}`}>
          <SearchPanelTop
            s={s}
            onOpenFilter={onOpenFilter}
            inputRef={inputRef}
            compact={compact}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
          />
        </div>
        <SearchResults s={s} onShowOnMap={onShowOnMap} className="flex-1" />
      </div>
      {selected && store && (
        <ShopDetail
          store={store}
          branch={selected}
          path={shopPath}
          onBack={onBack}
          km={km}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          searchQuery={s.effectiveQ}
          onSelectBranch={onSelectBranch}
        />
      )}
    </>
  );
}
