'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_DAVAO_LOCATION,
  LOCATION_CHANGED_EVENT,
  checkLocationPermission,
  getSavedLocation,
  requestCurrentLocation,
  saveLocationWithHistory,
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
  // True when permission is allowed/unblocked, but the device hardware could not acquire GPS/network coordinates
  const [unavailable, setUnavailable] = useState(false);
  // The last ask ended without a place (prompt closed, blocked, or the device could not find itself).
  const [failed, setFailed] = useState(false);
  const askedRef = useRef(false);

  const request = useCallback(() => {
    setLocating(true);
    setFailed(false);
    setUnavailable(false);
    requestCurrentLocation(
      (loc) => {
        setLocation(loc);
        setDenied(false);
        setUnavailable(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setFailed(true);
        // Closing the browser's prompt or hardware timeout; distinguish real block from hardware inability
        void checkLocationPermission().then((state) => {
          if (state === 'denied') {
            setDenied(true);
            setUnavailable(false);
          } else {
            setDenied(false);
            setUnavailable(true);
          }
        });
      },
    );
  }, []);

  const useDefault = useCallback(() => {
    saveLocationWithHistory(DEFAULT_DAVAO_LOCATION);
    setLocation(DEFAULT_DAVAO_LOCATION);
    setDenied(false);
    setUnavailable(false);
    setFailed(false);
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
      if (state === 'denied') {
        setDenied(true);
        setUnavailable(false);
      } else {
        request();
      }
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

  return { location, locating, denied, unavailable, failed, request, useDefault };
}
