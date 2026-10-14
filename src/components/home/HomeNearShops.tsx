import Link from 'next/link';
import { Loader2, MapPin } from 'lucide-react';
import HomeSectionHeader from './HomeSectionHeader';
import type { SavedLocation } from '@/lib/customerLocation';
import HomeCarouselRow from './HomeCarouselRow';
import HomeShopCard from './HomeShopCard';
import type { StoreResult } from './homeTypes';
import type { NearFilters } from './homeFilters';

const CHOOSE_ON_MAP = '/map?select=1&returnTo=/&continueTo=/';

interface HomeNearShopsProps {
  readonly location: SavedLocation | null;
  readonly denied: boolean;
  readonly locating: boolean;
  readonly stores: StoreResult[];
  readonly loading: boolean;
  readonly filters: NearFilters;
  readonly onRequestLocation: () => void;
  readonly onResetDistance: () => void;
}

const box = 'card-soft flex flex-col items-center gap-3 px-6 py-8 text-center';

export default function HomeNearShops({ location, denied, locating, stores, loading, filters, onRequestLocation, onResetDistance }: HomeNearShopsProps) {
  let body: React.ReactNode;
  if (!location) {
    body = (
      <div className={box}>
        <MapPin size={24} className="text-taupe" />
        <p className="mobile-body-md text-ink-body">
          {denied ? 'Location is off for this site. Choose where you are on the map to see nearby shops.' : 'Turn on your location to see tailoring shops near you.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {!denied && (
            <button type="button" onClick={onRequestLocation} disabled={locating} className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-taupe disabled:opacity-60">
              {locating && <Loader2 size={16} className="animate-spin" />}
              Use my location
            </button>
          )}
          <Link href={CHOOSE_ON_MAP} className="flex h-12 items-center rounded-full border border-line px-6 text-sm text-ink transition-colors hover:border-ink">Choose on map</Link>
        </div>
      </div>
    );
  } else if (loading) {
    body = (
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2].map((i) => <div key={i} className="h-48 w-[250px] shrink-0 animate-pulse rounded-[20px] bg-sunken" />)}
      </div>
    );
  } else if (stores.length === 0) {
    body = (
      <div className={box}>
        <p className="mobile-body-md text-ink-body">
          {filters.radiusKm !== null ? `No shop within ${filters.radiusKm} km.` : filters.status !== 'all' ? 'No shops match this filter.' : 'No shops found near this location yet.'}
        </p>
        {filters.radiusKm !== null && (
          <button type="button" onClick={onResetDistance} className="h-12 rounded-full border border-line px-6 text-sm text-ink transition-colors hover:border-ink">Show all distances</button>
        )}
      </div>
    );
  } else {
    body = <HomeCarouselRow>{stores.map((store) => <HomeShopCard key={store.id} store={store} />)}</HomeCarouselRow>;
  }

  return (
    <section aria-labelledby="home-near-title">
      <HomeSectionHeader id="home-near-title" title="Near Shops" href="/search?tab=store&sortBy=distance" />
      {body}
    </section>
  );
}
