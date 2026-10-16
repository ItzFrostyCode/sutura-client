import { Loader2, Navigation } from 'lucide-react';
import { ESTIMATE_KMH, formatTravel } from './travelTime';

interface ShopDirectionsCardProps {
  readonly name: string;
  /** Straight-line km to the shop, when the person's location is known. */
  readonly km: number | null;
  readonly loading: boolean;
  readonly onGetDirections: () => void;
  readonly className?: string;
}

/**
 * Floats over the map (top right on desktop, across the top on tablet / phone) for the shop that is open: how far it is and
 * about how long it takes, with the Get Directions button that draws the route. Once a route is drawn the Active navigation
 * card takes this same spot.
 */
export default function ShopDirectionsCard({ name, km, loading, onGetDirections, className = '' }: ShopDirectionsCardProps) {
  const times = km != null ? { foot: (km / ESTIMATE_KMH.foot) * 60, bike: (km / ESTIMATE_KMH.bike) * 60, car: (km / ESTIMATE_KMH.car) * 60 } : null;

  return (
    <div className={`card-soft absolute z-20 p-3 sm:p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="mobile-body-md font-semibold text-ink">{km != null ? `${km.toFixed(1)} km away` : 'Directions'}</p>
          <p className="mobile-caption truncate text-ink-muted">{name}</p>
        </div>
        <button type="button" onClick={onGetDirections} disabled={loading} className="flex h-10 sm:h-11 shrink-0 items-center gap-1.5 sm:gap-2 rounded-full bg-taupe-dark px-3.5 sm:px-5 text-xs sm:text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
          Get Directions
        </button>
      </div>
      {times && (
        <div className="mt-2.5 grid grid-cols-3 text-center border-t border-line-subtle pt-2">
          {([['Walk', times.foot], ['Bike', times.bike], ['Drive', times.car]] as const).map(([label, minutes]) => (
            <div key={label}>
              <p className="mobile-body-sm font-semibold text-ink">{formatTravel(minutes)}</p>
              <p className="mobile-caption text-ink-muted">{label} · est.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
