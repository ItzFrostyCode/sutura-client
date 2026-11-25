'use client';

import { useEffect, useState } from 'react';
import { fetchTravelEstimates, type TravelEstimates } from './useDirections';

type LatLng = { lat: number; lng: number };

// One lookup per shop per spot: tapping the same shop again, or going back
// and forth in the list, reuses the answer instead of asking the router again.
// ~10 m rounding so a GPS wobble doesn't count as a new spot.
const cache = new Map<string, TravelEstimates>();
const keyFor = (from: LatLng, to: LatLng) =>
  [from.lat, from.lng, to.lat, to.lng].map((n) => n.toFixed(4)).join(',');

export type TravelEstimateState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; estimates: TravelEstimates }
  | { status: 'failed' };

/**
 * Road distance + travel times for the shop that was tapped on the Tailor
 * Locator. The list cards keep the instant straight-line distance; this asks
 * the route service only for the one shop being looked at.
 */
export function useTravelEstimates(from: LatLng | null, to: LatLng | null): TravelEstimateState {
  const key = from && to ? keyFor(from, to) : null;
  const [state, setState] = useState<{ key: string | null; value: TravelEstimateState }>({ key: null, value: { status: 'idle' } });

  useEffect(() => {
    if (!key || !from || !to) return;
    if (cache.has(key)) return;
    const controller = new AbortController();
    fetchTravelEstimates(from, to, controller.signal)
      .then((estimates) => {
        if (controller.signal.aborted) return;
        // Only successes are kept: after a failure, opening the shop again retries.
        if (estimates) cache.set(key, estimates);
        setState({ key, value: estimates ? { status: 'done', estimates } : { status: 'failed' } });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ key, value: { status: 'failed' } });
      });
    return () => controller.abort();
    // from/to are read through `key`, which already captures their values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) return { status: 'idle' };
  const hit = cache.get(key);
  if (hit) return { status: 'done', estimates: hit };
  return state.key === key ? state.value : { status: 'loading' };
}
