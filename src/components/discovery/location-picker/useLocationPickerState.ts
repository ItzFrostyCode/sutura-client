import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { SavedLocation, RecentLocation } from '@/lib/customerLocation';
import { getRecentLocations, addRecentLocation } from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery } from '@/lib/parseLocationInput';
import { DAVAO_CENTER } from './locationPickerTypes';
import { reverseGeocodeCoords, searchPlacesAroundDavao } from '@/lib/geocoding';
import { focusOn } from '@/lib/mapFocus';

export function useLocationPickerState(
  initial: SavedLocation | null,
  onConfirm: (loc: SavedLocation) => void,
) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recents, setRecents] = useState<RecentLocation[]>([]);
  const [position, setPosition] = useState<[number, number]>(
    initial ? [initial.lat, initial.lng] : DAVAO_CENTER
  );
  const [address, setAddress] = useState(initial?.address ?? '');
  const [district, setDistrict] = useState(initial?.district ?? '');
  const [locating, setLocating] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; display_name: string }[]>([]);
  const [error, setError] = useState('');
  const geocodeRequestId = useRef(0);
  const mapRef = useRef<LeafletMap | null>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecents(getRecentLocations());
    return () => {
      try {
        mapRef.current?.stop();
      } catch {
        // Safe fallback
      }
    };
  }, []);

  function reverseGeocode(lat: number, lng: number) {
    const requestId = ++geocodeRequestId.current;
    setReverseLoading(true);
    reverseGeocodeCoords(lat, lng)
      .then((res) => {
        if (requestId !== geocodeRequestId.current) return;
        setAddress(res.address);
        if (res.district) setDistrict(res.district);
      })
      .catch(() => {
        if (requestId !== geocodeRequestId.current) return;
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      })
      .finally(() => {
        if (requestId === geocodeRequestId.current) setReverseLoading(false);
      });
  }

  function handleMapMoveEnd(lat: number, lng: number) {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  }

  function jumpTo(lat: number, lng: number) {
    setPosition([lat, lng]);
    if (mapRef.current) focusOn(mapRef.current, lat, lng);
  }

  function handleUseCurrentLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setError('');
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        jumpTo(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setLocating(false);
      },
      () => {
        setError('Could not get your location. Check your browser’s location permission and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSearchSubmit() {
    const text = query.trim();
    if (!text) return;
    setError('');
    setSearchResults([]);

    const parsed = parseCoordsFromMapsLink(text);
    if (parsed) {
      jumpTo(parsed.lat, parsed.lng);
      reverseGeocode(parsed.lat, parsed.lng);
      setShowSuggestions(false);
      return;
    }

    const cleaned = cleanLocationQuery(text);

    setSearching(true);
    try {
      let data = await searchPlacesAroundDavao(cleaned);
      const firstSegment = cleaned.split(',')[0].trim();
      if (data.length === 0 && firstSegment && firstSegment !== cleaned) {
        data = await searchPlacesAroundDavao(firstSegment);
      }

      if (data.length === 0) {
        setError("Couldn't find that place. Try pasting the full Google Maps link, or a more specific address.");
        setShowSuggestions(false);
      } else if (data.length === 1) {
        const { lat, lng, display_name } = data[0];
        jumpTo(lat, lng);
        setAddress(display_name ?? cleaned);
        setShowSuggestions(false);
      } else {
        setSearchResults(data);
        setShowSuggestions(true);
      }
    } catch {
      setError('Something went wrong searching that. Please try again.');
      setShowSuggestions(false);
    } finally {
      setSearching(false);
    }
  }

  function handlePickSearchResult(r: { lat: number; lng: number; display_name: string }) {
    jumpTo(r.lat, r.lng);
    setAddress(r.display_name);
    setSearchResults([]);
    setShowSuggestions(false);
  }

  function handlePickRecent(loc: RecentLocation) {
    jumpTo(loc.lat, loc.lng);
    setAddress(loc.address);
    setDistrict(loc.district);
    setShowSuggestions(false);
  }

  function handleConfirm() {
    const loc: SavedLocation = { lat: position[0], lng: position[1], address, district };
    addRecentLocation(loc);
    onConfirm(loc);
  }

  function handleInputBlur() {
    blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150);
  }

  function handleInputFocus() {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setShowSuggestions(true);
  }

  const suggestionsVisible = showSuggestions && (searchResults.length > 0 || (!query.trim() && recents.length > 0));

  return {
    query,
    setQuery,
    recents,
    position,
    address,
    locating,
    reverseLoading,
    searching,
    searchResults,
    error,
    mapRef,
    suggestionsVisible,
    handleMapMoveEnd,
    handleUseCurrentLocation,
    handleSearchSubmit,
    handlePickSearchResult,
    handlePickRecent,
    handleConfirm,
    handleInputBlur,
    handleInputFocus,
  };
}
