import type { useSearchData } from '../hooks/useSearchData';
import SearchServicesTab from '../SearchServicesTab';
import SearchShowroomTab from '../SearchShowroomTab';
import SearchStoresTab from '../SearchStoresTab';
import { shopPassesFilters } from './shopFilters';

type SearchData = ReturnType<typeof useSearchData>;

const note = 'mobile-body-sm rounded-2xl bg-sunken px-4 py-3 text-ink-muted';

interface SearchResultsProps {
  readonly s: SearchData;
  /** Tapping a shop opens its profile in the panel. Returns false when it has no pin. */
  readonly onShowOnMap: (slug: string, path?: string) => boolean;
  readonly className?: string;
}

/**
 * The list for the chosen scope (the Stores / Catalog / Services switch is in the search block above it).
 * Stores keep their original look; the only addition is the up / down icon on each shop that drops its carousel.
 */
export default function SearchResults({ s, onShowOnMap, className = '' }: SearchResultsProps) {
  // The server cannot apply Open / Closed or Distance to services, so they are applied here.
  const services = s.services.filter((service) =>
    shopPassesFilters(service.store, { radiusKm: s.radiusKm, status: s.openStatus }, s.userCoords),
  );

  return (
    <div className={`min-h-0 space-y-3 overflow-y-auto px-4 pb-4 pt-2 ${className}`}>
      {s.radiusKm !== null && !s.userCoords && <p className={note}>Distance is on, but your location is not set. Use the location button on the map.</p>}
      {s.openStatus !== 'all' && s.activeTab === 'showroom' && <p className={note}>Open / Closed applies to shops and services, not to designs.</p>}

      {s.activeTab === 'store' && (
        <SearchStoresTab
          stores={s.stores}
          storesLoading={s.storesLoading}
          activeTab="store"
          setActiveTab={s.setActiveTab}
          effectiveQ={s.effectiveQ}
          items={s.items}
          total={s.total}
          gate={s.gate}
          userCoords={s.userCoords}
          department={s.department}
          onShowOnMap={onShowOnMap}
          inPanel
        />
      )}
      {s.activeTab === 'showroom' && (
        <SearchShowroomTab
          activeTab={s.activeTab}
          total={s.total}
          sortBy={s.sortBy}
          setSortBy={s.setSortBy}
          loading={s.loading}
          items={s.items}
          page={s.page}
          setPage={s.setPage}
          lastPage={s.lastPage}
          userCoords={s.userCoords}
        />
      )}
      {s.activeTab === 'services' && (
        <SearchServicesTab
          services={services}
          servicesLoading={s.servicesLoading}
          servicesTotal={services.length}
          packages={s.packages}
          stores={s.stores}
          activeTab={s.activeTab}
          effectiveQ={s.effectiveQ}
          gate={s.gate}
        />
      )}
    </div>
  );
}
