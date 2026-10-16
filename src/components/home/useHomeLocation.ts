'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LOCATION_CHANGED_EVENT,
  checkLocationPermission,
  getSavedLocation,
  requestCurrentLocation,
  type SavedLocation,
} from '@/lib/customerLocation';

/**
 * Where the visitor is browsing from, for the landing page.
 * A saved location is used as is. Otherwise the page asks the browser straight away, so the only prompt the
 * person sees is the browser's own permission prompt. If they have blocked location, nothing is asked again
 * (the browser would ignore it) and Near Shops offers choosing a place on the map instead.
 */
export function useHomeLocation() {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  // The last ask ended without a place (prompt closed, blocked, or the device could not find itself).
  const [failed, setFailed] = useState(false);
  const askedRef = useRef(false);

  const request = useCallback(() => {
    setLocating(true);
    setFailed(false);
    setDenied(false);
    requestCurrentLocation(
      (loc) => {
        setLocation(loc);
        setDenied(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setFailed(true);
        // Closing the browser's prompt also reports an error; only a real block should hide "Use my location".
        void checkLocationPermission().then((state) => setDenied(state === 'denied'));
      },
    );
  }, []);

  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setLocation(saved);
      return;
    }
    if (askedRef.current) return;
    askedRef.current = true;
    void checkLocationPermission().then((state) => {
      if (state === 'denied') setDenied(true);
      else request();
    });
  }, [request]);

  useEffect(() => {
    const onChange = (e: Event) => {
      const loc = (e as CustomEvent<SavedLocation>).detail;
      if (loc) setLocation(loc);
    };
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);

  return { location, locating, denied, failed, request };
}
