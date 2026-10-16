'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Map as LeafletMap } from 'leaflet';
import { DEFAULT_DAVAO_LOCATION, getSavedLocation, requestCurrentLocation, saveLocationWithHistory, type SavedLocation } from '@/lib/customerLocation';
import { parseCoordsFromMapsLink } from '@/lib/parseLocationInput';
import { reverseGeocodeCoords, searchPlacesAroundDavao, type PlaceSearchResult } from '@/lib/geocoding';
import { focusOn, safeLocalPath, withFocusParam } from '@/lib/mapFocus';
import { lastPage } from '@/lib/lastPage';

export const DAVAO_CENTER = { lat: 7.0731, lng: 125.6128 };

/** Where the map opens: the saved place at street level, or Davao City when there is none yet. */
export interface StartView { readonly lat: number; readonly lng: number; readonly zoom: number }

/**
 * The "Choose on map" screen: a map with a pin fixed in the middle; moving the map under it chooses the place. Only the map —
 * no shops — because the person is picking a place, not a store. Opened from /location (or a form) with
 * `?select=1&returnTo=…&continueTo=…`: Back goes to where they came from, choosing goes on to `continueTo`.
 */
export function useChooseLocation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<LeafletMap | null>(null);
  const returnTo = safeLocalPath(searchParams.get('returnTo'));
  const continueTo = safeLocalPath(searchParams.get('continueTo'));
  const incomingQ = searchParams.get('q')?.trim() ?? '';

  // undefined = not read yet (the map waits for it so it opens at the right place), null = nothing saved.
  const [start, setStart] = useState<StartView | null | undefined>(undefined);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(DAVAO_CENTER);
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [reverseLoading, setReverseLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setStart({ lat: saved.lat, lng: saved.lng, zoom: 16 });
      setCenter({ lat: saved.lat, lng: saved.lng });
      setAddress(saved.address || '');
      setDistrict(saved.district || '');
    } else {
      setStart(null);
    }
  }, []);

  // Back goes to the page that opened this one (`returnTo`), else the last real page the person was on, else the landing page.
  // Browser history is not used: its "previous page" can be the screen that opened this one, which led straight back here.
  const goBack = useCallback(() => {
    router.push(returnTo ?? lastPage() ?? '/');
  }, [router, returnTo]);

  // Every time the map stops, look up the address under the pin (a short wait, so it is not asked for while the map is still moving).
  const handleMapMoveEnd = useCallback((lat: number, lng: number) => {
    setCenter((prev) => (Math.abs(prev.lat - lat) < 0.00001 && Math.abs(prev.lng - lng) < 0.00001 ? prev : { lat, lng }));
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(async () => {
      setReverseLoading(true);
      try {
        const res = await reverseGeocodeCoords(lat, lng);
        setAddress(res.address);
        if (res.district) setDistrict(res.district);
      } catch {
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } finally {
        setReverseLoading(false);
      }
    }, 300);
  }, []);

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  const goTo = useCallback((lat: number, lng: number) => {
    if (mapRef.current) focusOn(mapRef.current, lat, lng);
  }, []);

  const submitSearch = useCallback(async () => {
    const text = query.trim();
    if (!text) return;
    setError('');
    setResults([]);
    const parsed = parseCoordsFromMapsLink(text);
    if (parsed) {
      goTo(parsed.lat, parsed.lng);
      return;
    }
    setSearching(true);
    try {
      const places = await searchPlacesAroundDavao(text);
      if (!Array.isArray(places) || places.length === 0) setError('No places found around Davao City. Try a landmark or a street.');
      else setResults(places.slice(0, 6));
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [query, goTo]);

  const pickResult = useCallback((place: PlaceSearchResult) => {
    setResults([]);
    setQuery('');
    goTo(place.lat, place.lng);
  }, [goTo]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError('');
  }, []);

  // My location, as in Google Maps: the blue dot appears and the map zooms IN to it.
  const locate = useCallback(() => {
    setLocating(true);
    setError('');
    requestCurrentLocation(
      (loc) => {
        setUserLocation({ lat: loc.lat, lng: loc.lng });
        setCenter({ lat: loc.lat, lng: loc.lng });
        setAddress(loc.address);
        setDistrict(loc.district);
        goTo(loc.lat, loc.lng);
        setLocating(false);
      },
      () => {
        // Fallback when hardware GPS is unavailable on desktop PC:
        const def = DEFAULT_DAVAO_LOCATION;
        setUserLocation({ lat: def.lat, lng: def.lng });
        setCenter({ lat: def.lat, lng: def.lng });
        setAddress(def.address);
        setDistrict(def.district);
        goTo(def.lat, def.lng);
        setError('GPS hardware unavailable on this device. Centered on Davao City — drag the map to your place.');
        setLocating(false);
      }
    );
  }, [goTo]);

  const confirm = useCallback(() => {
    const place: SavedLocation = {
      lat: center.lat,
      lng: center.lng,
      address: address || `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`,
      district: district || 'Davao City',
    };
    saveLocationWithHistory(place);
    const dest = continueTo ?? (returnTo && returnTo !== '/' ? returnTo : '/search');
    const withQuery = incomingQ && !dest.includes('q=') ? `${dest}${dest.includes('?') ? '&' : '?'}q=${encodeURIComponent(incomingQ)}` : dest;
    router.replace(withFocusParam(withQuery));
  }, [center, address, district, continueTo, returnTo, incomingQ, router]);

  return { mapRef, start, address, reverseLoading, userLocation, locating, error, query, setQuery, searching, results, goBack, handleMapMoveEnd, submitSearch, pickResult, clearSearch, locate, zoomIn, zoomOut, confirm };
}
