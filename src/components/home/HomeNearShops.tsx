import Link from 'next/link';
import { Loader2, MapPin } from 'lucide-react';
import HomeSectionHeader from './HomeSectionHeader';
import { ShopCardSkeleton, SkeletonRow } from './HomeSkeletons';
import type { SavedLocation } from '@/lib/customerLocation';
import HomeCarouselRow from './HomeCarouselRow';
import HomeShopCard from './HomeShopCard';
import type { StoreResult } from './homeTypes';
import type { MoreFilters, NearFilters } from './homeFilters';

const CHOOSE_ON_MAP = '/map?select=1&returnTo=/&continueTo=/';

interface HomeNearShopsProps {
  readonly location: SavedLocation | null;
  readonly denied: boolean;
  readonly locating: boolean;
  readonly stores: StoreResult[];
  readonly loading: boolean;
  readonly filters: NearFilters & Partial<MoreFilters>;
  readonly onRequestLocation: () => void;
  readonly onResetDistance: () => void;
  /** Turns Open / Closed back to all shops (the empty "open now" list offers it). */
  readonly onResetStatus?: () => void;
  /** The filter panel, placed above the list so a change is seen right where it happens. */
  readonly filterBar?: React.ReactNode;
}

const box = 'card-soft flex flex-col items-center gap-3 px-6 py-8 text-center';

export default function HomeNearShops({ location, denied, locating, stores, loading, filters, onRequestLocation, onResetDistance, onResetStatus, filterBar }: HomeNearShopsProps) {
  let body: React.ReactNode;
  if (loading) {
    body = (
      <SkeletonRow>{(i) => <ShopCardSkeleton key={i} />}</SkeletonRow>
    );
  } else if (stores.length > 0) {
    body = (
      <div className="space-y-2">
        {!location && (
          <div className="flex items-center justify-between px-1 text-xs text-ink-muted">
            <span>Tailoring shops in Davao City</span>
            <Link href={CHOOSE_ON_MAP} className="font-medium text-taupe transition-colors hover:text-ink hover:underline">
              Choose on map for distance &rarr;
            </Link>
          </div>
        )}
        <HomeCarouselRow>{stores.map((store) => <HomeShopCard key={store.id} store={store} />)}</HomeCarouselRow>
      </div>
    );
  } else if (!location) {
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
  } else {
    body = (
      <div className={box}>
        <p className="mobile-body-md text-ink-body">
          {filters.radiusKm !== null ? `No shop within ${filters.radiusKm} km.`
            : filters.status === 'open' ? 'No shop is open right now. The shops are there; they are closed at this hour.'
            : filters.status === 'closed' ? 'Every shop near you is open right now.'
            : 'No shops found near this location yet.'}
        </p>
        {filters.radiusKm !== null && (
          <button type="button" onClick={onResetDistance} className="h-12 rounded-full border border-line px-6 text-sm text-ink transition-colors hover:border-ink">Show all distances</button>
        )}
        {filters.radiusKm === null && filters.status !== 'all' && onResetStatus && (
          <button type="button" onClick={onResetStatus} className="h-12 rounded-full border border-line px-6 text-sm text-ink transition-colors hover:border-ink">Show all shops</button>
        )}
      </div>
    );
  }

  return (
    <section aria-labelledby="home-near-title">
      <HomeSectionHeader id="home-near-title" title="Shops near you" href="/shops" linkLabel="See all" />
      {filterBar}
      {body}
    </section>
  );
}
