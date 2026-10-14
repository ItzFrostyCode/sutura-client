'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { SavedLocation } from '@/lib/customerLocation';
import { MAX_RADIUS_KM } from '../homeFilters';

/** Past this, the visitor is not in or near Davao City (50 km from the centre covers the whole city). */
export const NEARBY_KM = MAX_RADIUS_KM;
/** How long "Pinpointing your location…" waits for the browser prompt before asking for permission on the page. */
const ASK_TIMEOUT_MS = 8000;
/** "Finding tailoring shops…" stays at least this long, so the screens follow one another instead of flashing. */
const MIN_FINDING_MS = 1000;

// Once cleared, going back to the landing page inside the app shows the page straight away; a reload asks again.
let clearedThisLoad = false;

export type GatePhase = 'pinpointing' | 'permission' | 'finding' | 'far' | 'done';

interface GatePlace {
  readonly location: SavedLocation | null;
  readonly denied: boolean;
  readonly failed: boolean;
  readonly request: () => void;
}

/**
 * The landing page's opening sequence: pinpoint the visitor → find the shops near them → show the page.
 * It asks for permission on the page when the browser prompt goes unanswered or fails, and says so when the
 * nearest shop is too far (someone outside Davao), while still letting them in or onto the map.
 */
export function useLocationGate(place: GatePlace) {
  const [cleared, setCleared] = useState(clearedThisLoad);
  const [timedOut, setTimedOut] = useState(false);
  const [farKm, setFarKm] = useState<number | null>(null);

  const enter = useCallback(() => {
    clearedThisLoad = true;
    setCleared(true);
  }, []);

  const retry = useCallback(() => {
    setTimedOut(false);
    place.request();
  }, [place]);

  const hasLocation = place.location !== null;
  useEffect(() => {
    if (cleared || hasLocation) return;
    const timer = setTimeout(() => setTimedOut(true), ASK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [cleared, hasLocation, timedOut]);

  const lat = place.location?.lat;
  const lng = place.location?.lng;
  useEffect(() => {
    if (cleared || lat === undefined || lng === undefined) return;
    let cancelled = false;
    const started = Date.now();
    setFarKm(null);
    api.get('/public/stores', { params: { lat, lng, sort_by: 'distance', per_page: 1 } })
      .then((res) => {
        const km = res.data.data?.[0]?.distance_km;
        return km === null || km === undefined ? null : Number(km);
      })
      .catch(() => null)
      .then((km) => {
        const wait = Math.max(0, MIN_FINDING_MS - (Date.now() - started));
        setTimeout(() => {
          if (cancelled) return;
          // No answer or no shop with a map pin: nothing to warn about, so just open the page.
          if (km !== null && Number.isFinite(km) && km > NEARBY_KM) setFarKm(km);
          else enter();
        }, wait);
      });
    return () => { cancelled = true; };
  }, [cleared, lat, lng, enter]);

  let phase: GatePhase;
  if (cleared) phase = 'done';
  else if (farKm !== null) phase = 'far';
  else if (hasLocation) phase = 'finding';
  else if (place.denied || place.failed || timedOut) phase = 'permission';
  else phase = 'pinpointing';

  return { phase, farKm, denied: place.denied, enter, retry };
}
