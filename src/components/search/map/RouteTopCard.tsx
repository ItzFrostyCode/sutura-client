import { ArrowLeft, Bike, Car, Footprints, MapPin } from 'lucide-react';
import { formatMinutesShort } from './travelTime';
import RouteSummary from './RouteSummary';
import type { ShownRoute } from './useNavigation';
import type { TravelMode } from './useRouteTo';

// Across the top on a phone or tablet; top right on desktop, where the summary sits inside this card.
const SLOT = 'max-lg:inset-x-4 max-lg:top-3 lg:right-4 lg:top-4 lg:w-[440px]';

const TABS: { mode: TravelMode; label: string; Icon: typeof Car }[] = [
  { mode: 'car', label: 'Drive', Icon: Car },
  { mode: 'bike', label: 'Bike', Icon: Bike },
  { mode: 'foot', label: 'Walk', Icon: Footprints },
];

interface RouteTopCardProps {
  readonly route: ShownRoute;
  readonly mode: TravelMode;
  readonly onMode: (mode: TravelMode) => void;
  /** Back out of the route to the shop. */
  readonly onBack: () => void;
}

/**
 * Directions mode, top of the map: back, From → To, and one tab per way of travelling with its time. Picking a tab
 * redraws the route for it. Only the essentials are here; the answer (time, distance, arrival) is in RouteSummary.
 */
export default function RouteTopCard({ route, mode, onMode, onBack }: RouteTopCardProps) {
  return (
    <div className={`card-soft absolute z-20 p-3 ${SLOT}`}>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onBack} aria-label="Back to the shop" className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-sunken active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1 rounded-xl border border-line-strong px-3 py-1.5">
          <p className="flex items-center gap-2 text-xs text-ink-muted"><span aria-hidden className="h-2 w-2 shrink-0 rounded-full border-2 border-ink-muted" />Your location</p>
          <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-ink"><MapPin size={14} className="shrink-0 text-taupe-dark" /><span className="truncate">{route.name}</span></p>
        </div>
      </div>

      <div role="tablist" aria-label="Way of travelling" className="mt-2 grid grid-cols-3 gap-1">
        {TABS.map(({ mode: m, label, Icon }) => {
          const on = m === mode;
          return (
            <button key={m} type="button" role="tab" aria-selected={on} aria-label={`${label}, ${formatMinutesShort(route[m].minutes)}`} onClick={() => onMode(m)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm transition-colors ${on ? 'bg-espresso/10 font-semibold text-espresso' : 'text-ink-muted hover:bg-sunken'}`}>
              <Icon size={16} className="shrink-0" />{formatMinutesShort(route[m].minutes)}
            </button>
          );
        })}
      </div>

      <div className="mt-3 hidden border-t border-line pt-3 lg:block"><RouteSummary route={route} mode={mode} /></div>
    </div>
  );
}
