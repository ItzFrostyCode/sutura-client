import { Bike, Car, Footprints, X } from 'lucide-react';
import type { ActiveRoute } from './useRouteTo';
import type { LiveStatus } from './useLivePosition';
import { formatTravel } from './travelTime';

interface ActiveNavigationCardProps {
  readonly route: ActiveRoute;
  readonly status: LiveStatus;
  readonly onCancel: () => void;
  readonly className?: string;
}

const chip = 'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-sunken px-2.5 py-1 text-xs text-ink-body';

const STATUS_TEXT: Record<LiveStatus, string> = {
  idle: '',
  waiting: 'Finding your GPS…',
  live: 'Live',
  denied: 'Allow location to follow your trip',
  unavailable: 'GPS not available',
};

/** While a route is drawn: where to and how far, the live GPS state, and on ONE row the time left on foot, by bike and by car (slowest to fastest, the same order as the Get Directions card), with Cancel on top. */
export default function ActiveNavigationCard({ route, status, onCancel, className = '' }: ActiveNavigationCardProps) {
  const live = status === 'live';
  return (
    <div className={`card-soft absolute z-20 p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mobile-caption flex items-center gap-1.5 font-semibold uppercase tracking-wide text-sage">
            Active navigation
            <span className={`flex items-center gap-1 normal-case tracking-normal ${live ? 'text-sage' : 'text-ink-muted'}`}>
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-sage' : 'bg-ink-faint'}`} />
              {STATUS_TEXT[status]}
            </span>
          </p>
          <p className="mobile-body-md mt-0.5 flex items-baseline gap-1.5 font-semibold text-ink">
            <span className="truncate">{route.name}</span>
            <span className="mobile-body-sm shrink-0 font-normal text-ink-muted">· {route.car.km.toFixed(1)} km</span>
          </p>
        </div>
        <button type="button" onClick={onCancel} className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-danger/10 px-4 text-sm font-semibold text-danger transition-opacity hover:opacity-80">
          <X size={16} />
          Cancel
        </button>
      </div>
      {/* Walk, bike (and motorbike), car — one row that never wraps; if a screen is too narrow it scrolls sideways instead. */}
      <div className="no-scrollbar mt-2 flex flex-nowrap gap-1.5 overflow-x-auto">
        <span className={chip}><Footprints size={12} />{formatTravel(route.foot.minutes)}</span>
        <span className={chip}><Bike size={12} />{formatTravel(route.bike.minutes)}</span>
        <span className={chip}><Car size={12} />{formatTravel(route.car.minutes)}</span>
      </div>
    </div>
  );
}
