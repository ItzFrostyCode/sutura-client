'use client';

import { useCallback, useMemo, useState, type MutableRefObject } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useRouteTo, type ActiveRoute, type Point, type TravelMode } from './useRouteTo';
import type { LatLng } from './routeProgress';
import { focusOn, type FocusPad } from '@/lib/mapFocus';

/**
 * Route navigation on the search map: Get Directions draws the road route from the user's selected location
 * directly to the shop. Uses the saved origin without asking for hardware GPS permission again or overriding
 * the user's chosen location.
 */
/** The drawn route with the line of the way of travelling that is picked (Drive, Bike or Walk). */
export type ShownRoute = ActiveRoute & { readonly line: LatLng[] };

export function useNavigation(savedOrigin: Point | null, mapRef: MutableRefObject<LeafletMap | null>) {
  const { route: found, loading, start, reroute, cancel } = useRouteTo(savedOrigin);
  const [following, setFollowing] = useState(true);
  const [mode, setMode] = useState<TravelMode>('car');
  const route = useMemo<ShownRoute | null>(() => (found ? { ...found, line: found.lines[mode] } : null), [found, mode]);

  const begin = useCallback((to: Point, slug: string, name: string) => {
    setFollowing(true);
    setMode('car'); // a new Get Directions starts on Drive, like Google
    return start(to, slug, name);
  }, [start]);

  const stopFollowing = useCallback(() => setFollowing(false), []);
  const recenter = useCallback((pad?: FocusPad) => {
    setFollowing(true);
    const map = mapRef.current;
    if (map && savedOrigin) focusOn(map, savedOrigin.lat, savedOrigin.lng, pad);
  }, [mapRef, savedOrigin]);

  return {
    route,
    mode,
    setMode,
    fitLine: route?.line ?? null,
    position: savedOrigin,
    course: null,
    status: 'idle' as const,
    following,
    loading,
    start: begin,
    reroute,
    cancel,
    stopFollowing,
    recenter,
  };
}
