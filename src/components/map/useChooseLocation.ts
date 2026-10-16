'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Map as LeafletMap } from 'leaflet';
import {
  getSavedLocation,
  requestCurrentLocation,
  saveLocationWithHistory,
  getRecentLocations,
  addRecentLocation,
  removeRecentLocation,
  clearRecentLocations,
  getHomeLocation,
  type SavedLocation,
  type RecentLocation,
  type HomeLocation,
} from '@/lib/customerLocation';
import { parseCoordsFromMapsLink } from '@/lib/parseLocationInput';
import { reverseGeocodeCoords, searchPlacesAroundDavao, type PlaceSearchResult } from '@/lib/geocoding';
import { focusOn, safeLocalPath, withFocusParam } from '@/lib/mapFocus';
import { lastPage } from '@/lib/lastPage';

export const DAVAO_CENTER = { lat: 7.0731, lng: 125.6128 };

export const DAVAO_POPULAR_LANDMARKS = [
  { name: 'Almendras Gym (Davao City Recreation Center)', address: 'Quimpo Blvd, Poblacion, Davao City', lat: 7.0617, lng: 125.6109 },
  { name: 'Washington Street', address: 'Washington St, Barangay 39-D, Poblacion, Davao City', lat: 7.0628, lng: 125.6106 },
  { name: 'A. Pichon Street', address: 'A. Pichon St, Poblacion, Davao City', lat: 7.0673, lng: 125.6074 },
  { name: 'Poblacion District', address: 'Poblacion, Davao City', lat: 7.0707, lng: 125.6083 },
  { name: 'STI College Davao', address: 'J.P. Laurel Ave, Poblacion, Davao City', lat: 7.0858, lng: 125.6142 },
  { name: 'Abreeza Mall', address: 'J.P. Laurel Ave, Bajada, Davao City', lat: 7.0906, lng: 125.6125 },
  { name: 'SM City Davao', address: 'Quimpo Blvd, Ecoland, Matina, Davao City', lat: 7.0494, lng: 125.5906 },
  { name: 'SM Lanang Premier', address: 'J.P. Laurel Ave, Lanang, Davao City', lat: 7.0991, lng: 125.6319 },
  { name: 'Gaisano Mall of Davao', address: 'J.P. Laurel Ave, Bajada, Davao City', lat: 7.0784, lng: 125.6139 },
  { name: 'Victoria Plaza', address: 'J.P. Laurel Ave, Bajada, Davao City', lat: 7.0863, lng: 125.6148 },
  { name: 'Roxas Night Market', address: 'Roxas Ave, Poblacion, Davao City', lat: 7.0704, lng: 125.6133 },
  { name: 'People’s Park Davao', address: 'Palma Gil St, Poblacion, Davao City', lat: 7.0718, lng: 125.6092 },
  { name: 'Davao City Hall', address: 'San Pedro St, Poblacion, Davao City', lat: 7.0648, lng: 125.6088 },
];

/** Where the map opens: the saved place at street level, or Davao City when there is none yet. */
export interface StartView { readonly lat: number; readonly lng: number; readonly zoom: number }

export interface ChooseLocationOptions {
  readonly initial?: SavedLocation | null;
  readonly onClose?: () => void;
  readonly onConfirm?: (loc: SavedLocation) => void;
  readonly confirmLabel?: string;
}

/**
 * The "Choose on map" screen: a map with a pin fixed in the middle; moving the map under it chooses the place. Only the map —
 * no shops — because the person is picking a place, not a store. Opened from /location (or a form) with
 * `?select=1&returnTo=…&continueTo=…`: Back goes to where they came from, choosing goes on to `continueTo`.
 */
export function useChooseLocation(options?: ChooseLocationOptions) {
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
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([]);
  const [recents, setRecents] = useState<RecentLocation[]>([]);
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (options?.initial?.lat != null && options?.initial?.lng != null) {
      setStart({ lat: options.initial.lat, lng: options.initial.lng, zoom: 16 });
      setCenter({ lat: options.initial.lat, lng: options.initial.lng });
      setAddress(options.initial.address || '');
      setDistrict(options.initial.district || 'Davao City');
    } else {
      const saved = getSavedLocation();
      if (saved) {
        setStart({ lat: saved.lat, lng: saved.lng, zoom: 16 });
        setCenter({ lat: saved.lat, lng: saved.lng });
        setAddress(saved.address || '');
        setDistrict(saved.district || '');
      } else {
        setStart(null);
      }
    }
    setRecents(getRecentLocations());
    setHomeLocation(getHomeLocation());
  }, [options?.initial]);

  // Back goes to the page that opened this one (`returnTo`), else the last real page the person was on, else the landing page.
  const goBack = useCallback(() => {
    if (options?.onClose) {
      options.onClose();
      return;
    }
    router.push(returnTo ?? lastPage() ?? '/');
  }, [router, returnTo, options?.onClose]);

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

  // Debounced live suggestions when typing with instant landmark resolution
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    setError('');

    // Instant local matches from popular landmarks
    const qLower = trimmed.toLowerCase();
    const localMatches: PlaceSearchResult[] = DAVAO_POPULAR_LANDMARKS
      .filter((l) => l.name.toLowerCase().includes(qLower) || l.address.toLowerCase().includes(qLower))
      .map((l) => ({
        lat: l.lat,
        lng: l.lng,
        display_name: `${l.name}, ${l.address}`,
      }));

    if (localMatches.length > 0) {
      setSuggestions(localMatches);
    }

    const timer = setTimeout(async () => {
      try {
        const places = await searchPlacesAroundDavao(trimmed);
        if (places.length > 0) {
          const seen = new Set(places.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`));
          const merged = [
            ...places,
            ...localMatches.filter((lm) => !seen.has(`${lm.lat.toFixed(4)},${lm.lng.toFixed(4)}`)),
          ];
          setSuggestions(merged.slice(0, 8));
        } else if (localMatches.length === 0) {
          setSuggestions([]);
        }
      } catch {
        if (localMatches.length === 0) {
          setSuggestions([]);
        }
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const pickPlace = useCallback((lat: number, lng: number, displayName: string) => {
    const placeObj: SavedLocation = {
      lat,
      lng,
      address: displayName,
      district: 'Davao City',
    };
    addRecentLocation(placeObj);
    setRecents(getRecentLocations());
    goTo(lat, lng);
    setQuery('');
    setSuggestions([]);
    setResults([]);
    setIsFocused(false);
  }, [goTo]);

  const removeRecent = useCallback((lat: number, lng: number) => {
    removeRecentLocation(lat, lng);
    setRecents(getRecentLocations());
  }, []);

  const clearAllRecents = useCallback(() => {
    clearRecentLocations();
    setRecents([]);
  }, []);

  const submitSearch = useCallback(async () => {
    const text = query.trim();
    if (!text) return;
    if (suggestions.length > 0) {
      pickPlace(suggestions[0].lat, suggestions[0].lng, suggestions[0].display_name);
      return;
    }
    setError('');
    setResults([]);
    const parsed = parseCoordsFromMapsLink(text);
    if (parsed) {
      goTo(parsed.lat, parsed.lng);
      setIsFocused(false);
      return;
    }
    setSearching(true);
    try {
      const places = await searchPlacesAroundDavao(text);
      if (!Array.isArray(places) || places.length === 0) {
        setError('No places found around Davao City. Try a landmark or a street.');
      } else {
        pickPlace(places[0].lat, places[0].lng, places[0].display_name);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [query, suggestions, pickPlace, goTo]);

  const pickResult = useCallback((place: PlaceSearchResult) => {
    pickPlace(place.lat, place.lng, place.display_name);
  }, [pickPlace]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
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
        setError('Could not get your location. Check your browser’s location permission.');
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
    if (options?.onConfirm) {
      options.onConfirm(place);
      return;
    }
    const dest = continueTo ?? (returnTo && returnTo !== '/' ? returnTo : '/search');
    const withQuery = incomingQ && !dest.includes('q=') ? `${dest}${dest.includes('?') ? '&' : '?'}q=${encodeURIComponent(incomingQ)}` : dest;
    router.replace(withFocusParam(withQuery));
  }, [center, address, district, continueTo, returnTo, incomingQ, router, options?.onConfirm]);

  return {
    mapRef,
    start,
    address,
    reverseLoading,
    userLocation,
    locating,
    error,
    query,
    setQuery,
    searching,
    results,
    suggestions,
    recents,
    homeLocation,
    isFocused,
    setIsFocused,
    pickPlace,
    removeRecent,
    clearAllRecents,
    goBack,
    handleMapMoveEnd,
    submitSearch,
    pickResult,
    clearSearch,
    locate,
    zoomIn,
    zoomOut,
    confirm,
  };
}
