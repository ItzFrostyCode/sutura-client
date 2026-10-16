'use client';

import { useCallback, useState, type MutableRefObject } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useRouteTo, type Point } from './useRouteTo';
import { focusOn, type FocusPad } from '@/lib/mapFocus';

/**
 * Route navigation on the search map: Get Directions draws the road route from the user's selected location
 * directly to the shop. Uses the saved origin without asking for hardware GPS permission again or overriding
 * the user's chosen location.
 */
export function useNavigation(savedOrigin: Point | null, mapRef: MutableRefObject<LeafletMap | null>) {
  const { route, loading, start, cancel } = useRouteTo(savedOrigin);
  const [following, setFollowing] = useState(true);

  const begin = useCallback((to: Point, slug: string, name: string) => {
    setFollowing(true);
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
    fitLine: route?.line ?? null,
    position: savedOrigin,
    course: null,
    status: 'idle' as const,
    following,
    loading,
    start: begin,
    cancel,
    stopFollowing,
    recenter,
  };
}
