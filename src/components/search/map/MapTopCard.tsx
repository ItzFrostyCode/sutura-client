import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import { haversineKm } from '@/lib/customerLocation';
import ActiveNavigationCard from './ActiveNavigationCard';
import ShopDirectionsCard from './ShopDirectionsCard';
import type { useNavigation } from './useNavigation';

// One spot for both cards, so one takes the place of the other: top right on desktop, across the top on tablet and phone.
const SLOT = 'max-lg:inset-x-4 max-lg:top-3 max-lg:mx-auto max-lg:max-w-[var(--col-w)] lg:right-4 lg:top-4 lg:w-[440px]';

interface MapTopCardProps {
  readonly nav: ReturnType<typeof useNavigation>;
  /** The shop open in the panel, if any. */
  readonly selected: DiscoveryMapBranch | null;
  readonly userCoords: { lat: number; lng: number } | null;
  readonly onGetDirections: (branch: DiscoveryMapBranch, storeName: string) => void;
}

/** The card at the top of the map: Active navigation while a route is drawn, otherwise Get Directions for the shop that is open. */
export default function MapTopCard({ nav, selected, userCoords, onGetDirections }: MapTopCardProps) {
  if (nav.route) return <ActiveNavigationCard route={nav.route} status={nav.status} onCancel={nav.cancel} className={SLOT} />;
  if (!selected) return null;
  const km = userCoords ? haversineKm(userCoords.lat, userCoords.lng, selected.latitude, selected.longitude) : null;
  return (
    <ShopDirectionsCard
      name={selected.storeName}
      km={km}
      loading={nav.loading}
      onGetDirections={() => onGetDirections(selected, selected.storeName)}
      className={SLOT}
    />
  );
}
