import { Navigation } from 'lucide-react';
import { formatMinutesShort, GOOGLE_MODE } from './travelTime';
import type { ShownRoute } from './useNavigation';
import type { TravelMode } from './useRouteTo';

/**
 * The line under the map once a route is drawn: how long, how far, when you would arrive, and Start. Start opens the
 * turn-by-turn in Google Maps (SUTURA draws the route; it does not have its own voice navigation).
 */
export default function RouteSummary({ route, mode, className = '' }: { readonly route: ShownRoute; readonly mode: TravelMode; readonly className?: string }) {
  const leg = route[mode];
  const arrive = new Date(Date.now() + leg.minutes * 60000).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const handoff = `https://www.google.com/maps/dir/?api=1&destination=${route.to.lat},${route.to.lng}&travelmode=${GOOGLE_MODE[mode]}`;

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-tight text-sage">
            {formatMinutesShort(leg.minutes)} <span className="text-lg font-normal text-ink-muted">({leg.km.toFixed(1)} km)</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">Arrive {arrive}</p>
        </div>
        <a href={handoff} target="_blank" rel="noopener noreferrer" className="flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-ink px-6 text-sm font-semibold text-white transition-transform hover:bg-espresso active:scale-[0.98]">
          <Navigation size={16} /> Start
        </a>
      </div>
      <p className="mobile-caption mt-2 text-ink-muted">Start opens turn-by-turn in Google Maps.</p>
    </div>
  );
}
