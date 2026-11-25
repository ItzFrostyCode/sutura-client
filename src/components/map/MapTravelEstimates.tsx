'use client';

import { Bike, Car, Footprints } from 'lucide-react';
import { haversineKm } from '@/lib/customerLocation';
import { formatDistance, formatDuration } from './useDirections';
import { useTravelEstimates } from './useTravelEstimates';

type LatLng = { lat: number; lng: number };

const MODES = [
  { key: 'drive', label: 'Drive', Icon: Car },
  { key: 'bike', label: 'Bike', Icon: Bike },
  { key: 'walk', label: 'Walk', Icon: Footprints },
] as const;

const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

/**
 * Road distance + drive / bike / walk times for the tapped shop, from the
 * same route service as Active navigation, so both always show the same km.
 * The straight-line distance from the list stays underneath for reference.
 */
export default function MapTravelEstimates({ from, to }: {
  readonly from: LatLng;
  readonly to: LatLng;
}) {
  const state = useTravelEstimates(from, to);
  // Same formula as the list card's distance, so the two always agree.
  const straight = `${fmtKm(haversineKm(from.lat, from.lng, to.lat, to.lng))} straight line`;

  if (state.status === 'failed') {
    return (
      <div className="rounded-xl border border-line bg-surface p-3 text-xs">
        <p className="font-semibold tabular-nums text-ink">{straight}</p>
        <p className="mt-0.5 text-ink-muted">Road distance isn&apos;t available right now. Directions will try again.</p>
      </div>
    );
  }

  const estimates = state.status === 'done' ? state.estimates : null;
  const drive = estimates?.drive;

  return (
    <div className="rounded-xl border border-line bg-surface" aria-busy={!estimates}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 pt-3">
        {drive ? (
          <p className="text-ink">
            <span className="text-xl font-bold tabular-nums">{formatDistance(drive.distanceM)}</span>
            <span className="ml-1.5 text-xs text-ink-muted">by road</span>
          </p>
        ) : (
          <p className="text-xs text-ink-muted">Checking the road distance…</p>
        )}
        <p className="text-[11px] tabular-nums text-ink-faint">{straight}</p>
      </div>

      <dl className="mt-3 grid grid-cols-3 divide-x divide-line border-t border-line">
        {MODES.map(({ key, label, Icon }) => {
          const est = estimates?.[key];
          return (
            <div key={key} className="flex flex-col-reverse items-center px-1.5 py-2.5 text-center">
              <dt className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-ink-muted">
                <Icon size={12} aria-hidden="true" /> {label}
              </dt>
              <dd className="text-sm font-semibold tabular-nums text-ink">
                {est ? formatDuration(est.durationS) : estimates ? '—' : <span className="inline-block h-4 w-12 animate-pulse rounded bg-sunken align-middle" aria-hidden="true" />}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
