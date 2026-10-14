'use client';

import { Bike, Car, ExternalLink, Footprints, Loader2, MapPin, X } from 'lucide-react';
import { formatDistance, formatDuration, type ActiveRoute } from './useDirections';

interface ActiveNavigationPanelProps {
  readonly route: ActiveRoute | null;
  readonly loading: boolean;
  readonly onCancel: () => void;
  /** Position on the host map (default: top-right card). */
  readonly className?: string;
}

// Floating card over the map while a route is shown — the "Active
// navigation" box from the tarakape.cc reference.
const DEFAULT_POSITION = 'absolute top-3 left-3 right-3 sm:left-auto sm:w-[22rem] z-[1000]';

export default function ActiveNavigationPanel({ route, loading, onCancel, className = DEFAULT_POSITION }: ActiveNavigationPanelProps) {
  if (!route && !loading) return null;

  const googleUrl = route
    ? `https://www.google.com/maps/dir/?api=1&origin=${route.origin.lat},${route.origin.lng}&destination=${route.branch.latitude},${route.branch.longitude}`
    : null;
  const modes = route
    ? ([
        ['drive', Car, 'Drive'],
        ['bike', Bike, 'Bike'],
        ['walk', Footprints, 'Walk'],
      ] as const).filter(([key]) => route.modes[key])
    : [];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${className} border border-line bg-surface p-4 shadow-lg`}
    >
      {loading || !route ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 size={16} className="animate-spin text-taupe" aria-hidden="true" /> Finding the best route…
        </p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sage">Active navigation</p>
              <p className="mt-0.5 truncate text-base font-semibold text-ink">{route.branch.storeName}</p>
              {route.branch.branchName && (
                <p className="truncate text-xs text-ink-muted">{route.branch.branchName}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-9 shrink-0 items-center gap-1 border border-danger/30 bg-danger/5 px-3 text-xs font-semibold text-danger hover:bg-danger/10 cursor-pointer"
            >
              <X size={14} aria-hidden="true" /> Cancel
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {route.modes.drive && (
              <span className="inline-flex items-center gap-1.5 border border-line px-2 py-1 font-semibold text-ink">
                <MapPin size={14} className="text-taupe" aria-hidden="true" />
                {formatDistance(route.modes.drive.distanceM)}
              </span>
            )}
            {modes.map(([key, Icon, label]) => (
              <span key={key} className="inline-flex items-center gap-1.5 text-ink-body" title={label}>
                <Icon size={15} className="text-ink-muted" aria-hidden="true" />
                <span className="sr-only">{label}:</span>
                {formatDuration(route.modes[key]!.durationS)}
              </span>
            ))}
          </div>

          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-taupe underline underline-offset-2 hover:text-taupe-hover"
            >
              Turn-by-turn in Google Maps <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </>
      )}
    </div>
  );
}
