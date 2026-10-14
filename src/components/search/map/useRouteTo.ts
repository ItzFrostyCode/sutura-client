'use client';

import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { thinLine, type LatLng } from './routeProgress';

export interface RouteMode { readonly km: number; readonly minutes: number }
export interface Point { readonly lat: number; readonly lng: number }

export interface ActiveRoute {
  /** Counts up with every Get Directions; a re-route after leaving the road keeps its session. */
  readonly session: number;
  readonly slug: string;
  readonly name: string;
  readonly to: Point;
  /** The road line to draw, as [lat, lng] pairs. */
  readonly line: LatLng[];
  readonly car: RouteMode;
  readonly bike: RouteMode;
  readonly foot: RouteMode;
}

// OpenStreetMap's community routing servers (one per way of travelling). Free and keyless, fine for this project's
// size; a busy production site should host its own OSRM or use a paid provider.
const HOST = 'https://routing.openstreetmap.de';
const PROFILE = { car: 'routed-car', bike: 'routed-bike', foot: 'routed-foot' } as const;
const KMH = { bike: 15, foot: 5 };

async function fetchMode(profile: string, from: Point, to: Point, signal: AbortSignal) {
  const res = await fetch(`${HOST}/${profile}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`, { signal });
  if (!res.ok) throw new Error('routing failed');
  const route = (await res.json()).routes?.[0];
  if (!route) throw new Error('no route');
  return {
    km: route.distance / 1000,
    minutes: route.duration / 60,
    line: (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng] as LatLng),
  };
}

/** Draws a road route to a shop, with the time by car, bike and on foot; `reroute` draws it again from a new position. */
export function useRouteTo(origin: Point | null) {
  const toast = useToast();
  const [route, setRoute] = useState<ActiveRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const sessions = useRef(0);

  // `silent` = a re-route behind the scenes: the old line stays on screen, no spinner and no error toast.
  const request = useCallback(async (from: Point, to: Point, slug: string, name: string, session: number, silent: boolean) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    busy.current = true;
    if (!silent) setLoading(true);
    try {
      const [car, bike, foot] = await Promise.allSettled([
        fetchMode(PROFILE.car, from, to, controller.signal),
        fetchMode(PROFILE.bike, from, to, controller.signal),
        fetchMode(PROFILE.foot, from, to, controller.signal),
      ]);
      if (controller.signal.aborted) return;
      if (car.status !== 'fulfilled') throw new Error('no road route');
      // A mode the server could not answer falls back to an estimate from the road distance.
      const mode = (r: PromiseSettledResult<RouteMode>, kmh: number): RouteMode =>
        r.status === 'fulfilled' ? { km: r.value.km, minutes: r.value.minutes } : { km: car.value.km, minutes: (car.value.km / kmh) * 60 };
      setRoute({
        session,
        slug,
        name,
        to,
        line: thinLine(car.value.line),
        car: { km: car.value.km, minutes: car.value.minutes },
        bike: mode(bike, KMH.bike),
        foot: mode(foot, KMH.foot),
      });
    } catch {
      if (!controller.signal.aborted && !silent) toast.error('Could not get directions right now. Try again in a moment.');
    } finally {
      if (!controller.signal.aborted) {
        busy.current = false;
        if (!silent) setLoading(false);
      }
    }
  }, [toast]);

  const start = useCallback(async (to: Point, slug: string, name: string) => {
    if (!origin) {
      toast.error('Set your location first, then tap Get Directions.');
      return;
    }
    sessions.current += 1;
    await request(origin, to, slug, name, sessions.current, false);
  }, [origin, toast, request]);

  const reroute = useCallback((from: Point) => {
    if (!route || busy.current) return;
    void request(from, route.to, route.slug, route.name, route.session, true);
  }, [route, request]);

  const cancel = useCallback(() => {
    abort.current?.abort();
    busy.current = false;
    setRoute(null);
    setLoading(false);
  }, []);

  return { route, loading, start, reroute, cancel };
}
