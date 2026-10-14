'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useToast } from '@/context/ToastContext';
import { useRouteTo, type ActiveRoute, type Point, type RouteMode } from './useRouteTo';
import { useLivePosition } from './useLivePosition';
import { cumulativeKm, locateOnRoute } from './routeProgress';
import { focusOn, type FocusPad } from '@/lib/mapFocus';

const OFF_ROUTE_M = 80;
const REROUTE_EVERY_MS = 15000;
const ARRIVED_M = 40;

/**
 * Turn-by-turn style navigation on the search map: Get Directions draws the road route, then the live GPS moves the "You" dot
 * along it, the line behind the dot and the remaining km / minutes shrink, the map follows (until the person drags it), a route
 * is drawn again if they leave the road, and the trip ends by itself on arrival. Only the dot, the line and the card change
 * while moving — the shop list is not refetched and the map is not refitted.
 */
export function useNavigation(savedOrigin: Point | null, mapRef: MutableRefObject<LeafletMap | null>) {
  const toast = useToast();
  const { route, loading, start, reroute, cancel } = useRouteTo(savedOrigin);
  const { fix, status, course } = useLivePosition(route ? route.session : null);
  const [following, setFollowing] = useState(true);

  const cumulative = useMemo(() => (route ? cumulativeKm(route.line) : null), [route]);
  const where = useMemo(() => (route && cumulative && fix ? locateOnRoute(route.line, cumulative, fix) : null), [route, cumulative, fix]);
  const position = useMemo(() => (fix ? { lat: fix.lat, lng: fix.lng } : null), [fix]);

  // The line behind the person is dropped; it is only re-sliced when they pass a road point, not on every GPS reading.
  const index = where?.index ?? 0;
  const line = useMemo(() => (route && index > 0 ? route.line.slice(index) : route?.line ?? null), [route, index]);
  const fraction = where?.fraction ?? 1;
  const shown = useMemo<ActiveRoute | null>(() => {
    if (!route || !line) return null;
    const left = (mode: RouteMode): RouteMode => ({ km: mode.km * fraction, minutes: mode.minutes * fraction });
    return { ...route, line, car: left(route.car), bike: left(route.bike), foot: left(route.foot) };
  }, [route, line, fraction]);

  const arrived = Boolean(where && where.remainingKm * 1000 < ARRIVED_M);
  useEffect(() => {
    if (!arrived || !route) return;
    toast.success(`You have arrived at ${route.name}.`);
    cancel();
  }, [arrived, route, toast, cancel]);

  // Off the road for real (a confident reading, well away from the line): draw it again from here, at most every 15 s.
  const lost = Boolean(where && fix && fix.accuracy <= 100 && where.offMeters > Math.max(OFF_ROUTE_M, fix.accuracy));
  const lastReroute = useRef(0);
  useEffect(() => {
    if (!lost || !fix) return;
    const now = Date.now();
    if (now - lastReroute.current < REROUTE_EVERY_MS) return;
    lastReroute.current = now;
    reroute(fix);
  }, [lost, fix, reroute]);

  const begin = useCallback((to: Point, slug: string, name: string) => {
    setFollowing(true);
    return start(to, slug, name);
  }, [start]);

  const stopFollowing = useCallback(() => setFollowing(false), []);
  const recenter = useCallback((pad?: FocusPad) => {
    setFollowing(true);
    const map = mapRef.current;
    if (map && position) focusOn(map, position.lat, position.lng, pad);
  }, [mapRef, position]);

  return { route: shown, fitLine: route?.line ?? null, position, course, status, following, loading, start: begin, cancel, stopFollowing, recenter };
}
