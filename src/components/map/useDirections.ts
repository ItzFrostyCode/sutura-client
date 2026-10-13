'use client';

import { useCallback, useRef, useState } from 'react';
import { requestCurrentLocation } from '@/lib/customerLocation';

type LatLng = { lat: number; lng: number };
type Mode = 'drive' | 'bike' | 'walk';

export interface ModeEstimate {
  distanceM: number;
  durationS: number;
}

/** Where a route ends — any branch-like place (Tailor Locator pins, Find a Branch, …). */
export interface RouteDestination {
  latitude: number;
  longitude: number;
  storeName: string;
  branchName?: string;
}

export interface ActiveRoute {
  branch: RouteDestination;
  origin: LatLng;
  /** Driving route geometry as [lat, lng] pairs, drawn on the map. */
  path: [number, number][];
  modes: Partial<Record<Mode, ModeEstimate>>;
}

// OpenStreetMap community routers (FOSSGIS): free, CORS-enabled, one per
// travel mode. Same OSRM API for all three; only the host path differs.
const ROUTER: Record<Mode, string> = {
  drive: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  bike: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
  walk: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
};

async function fetchRoute(mode: Mode, from: LatLng, to: LatLng, withPath: boolean, signal: AbortSignal) {
  const url = `${ROUTER[mode]}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=${withPath ? 'full' : 'false'}&geometries=geojson`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Routing failed (${res.status})`);
  const data = await res.json();
  const route = data?.routes?.[0];
  if (data?.code !== 'Ok' || !route) throw new Error('No route found');
  return {
    estimate: { distanceM: route.distance as number, durationS: route.duration as number },
    path: withPath
      ? (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number])
      : [],
  };
}

/**
 * In-app directions on the Tailor Locator (adviser request, after
 * tarakape.cc): draws the road route from the customer to a branch and
 * shows drive / bike / walk estimates, instead of sending them off to
 * Google Maps. Google Maps stays one tap away for turn-by-turn navigation.
 */
export function useDirections() {
  const [route, setRoute] = useState<ActiveRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setRoute(null);
    setLoading(false);
    setError('');
  }, []);

  const routeFrom = useCallback(async (branch: RouteDestination, origin: LatLng) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const to = { lat: branch.latitude, lng: branch.longitude };

    try {
      // Driving draws the line; bike and walk only need their totals. A bike
      // or walk failure just leaves that estimate out.
      const [drive, bike, walk] = await Promise.allSettled([
        fetchRoute('drive', origin, to, true, controller.signal),
        fetchRoute('bike', origin, to, false, controller.signal),
        fetchRoute('walk', origin, to, false, controller.signal),
      ]);
      if (controller.signal.aborted) return;
      if (drive.status !== 'fulfilled') throw drive.reason;

      setRoute({
        branch,
        origin,
        path: drive.value.path,
        modes: {
          drive: drive.value.estimate,
          ...(bike.status === 'fulfilled' ? { bike: bike.value.estimate } : {}),
          ...(walk.status === 'fulfilled' ? { walk: walk.value.estimate } : {}),
        },
      });
    } catch {
      if (!controller.signal.aborted) {
        setRoute(null);
        setError('Could not get directions right now. Check your connection, or open the route in Google Maps.');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const start = useCallback((branch: RouteDestination, userLocation: LatLng | null) => {
    setError('');
    setLoading(true);
    setRoute(null);
    if (userLocation) {
      void routeFrom(branch, userLocation);
      return;
    }
    // No starting point yet — ask the browser (also saves it for next time).
    requestCurrentLocation(
      (loc) => void routeFrom(branch, { lat: loc.lat, lng: loc.lng }),
      () => {
        setLoading(false);
        setError('Turn on location so we can draw the route from where you are.');
      },
    );
  }, [routeFrom]);

  return { route, loading, error, start, cancel, dismissError: () => setError('') };
}

/** 1556 → "1.6 km", 820 → "820 m". */
export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

/** 252 → "5 mins", 4980 → "1 hr 23 mins". */
export function formatDuration(seconds: number): string {
  const totalMins = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const minText = `${m} ${m === 1 ? 'min' : 'mins'}`;
  if (h === 0) return minText;
  return `${h} ${h === 1 ? 'hr' : 'hrs'}${m ? ` ${minText}` : ''}`;
}
