import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { getRecentLocations, addRecentLocation, requestCurrentLocation, type SavedLocation, type RecentLocation } from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery } from '@/lib/parseLocationInput';
import { DAVAO_CENTER } from './locationPickerTypes';
import { reverseGeocodeCoords, searchPlacesAroundDavao } from '@/lib/geocoding';
import { focusOn } from '@/lib/mapFocus';

/** "A. Pichon St" vs "A. Pichon Street": same place once abbreviations and punctuation are evened out. */
function normalizePlaceName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,'’]/g, ' ')
    .replace(/\bst\b/g, 'street')
    .replace(/\bave?\b/g, 'avenue')
    .replace(/\bblvd\b/g, 'boulevard')
    .replace(/\brd\b/g, 'road')
    .replace(/\bext\b/g, 'extension')
    .replace(/\bbrgy\b/g, 'barangay')
    .replace(/\s+/g, ' ')
    .trim();
}

function samePlaceName(resultName: string, typed: string): boolean {
  // Spaces dropped too, so initials match however they're written ("J.P." / "JP").
  const a = normalizePlaceName(resultName).replace(/ /g, '');
  const b = normalizePlaceName(typed).replace(/ /g, '');
  return a.length > 0 && b.length > 0 && a === b;
}

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
  // A spot the user chose by name (search result or recent). When the
  // map finishes flying there, keep that name instead of replacing it with
  // whatever building reverse-geocoding finds nearest the pin.
  const keepLabelAt = useRef<[number, number] | null>(null);

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

  function reverseGeocode(lat: number, lng: number, keepAddress = false) {
    const requestId = ++geocodeRequestId.current;
    setReverseLoading(true);
    reverseGeocodeCoords(lat, lng)
      .then((res) => {
        if (requestId !== geocodeRequestId.current) return;
        if (!keepAddress) setAddress(res.address);
        if (res.district) setDistrict(res.district);
      })
      .catch(() => {
        if (requestId !== geocodeRequestId.current || keepAddress) return;
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      })
      .finally(() => {
        if (requestId === geocodeRequestId.current) setReverseLoading(false);
      });
  }

  function handleMapMoveEnd(lat: number, lng: number) {
    setPosition([lat, lng]);
    const kept = keepLabelAt.current;
    keepLabelAt.current = null;
    // ~30 m: the user did not drag the pin away from the named place.
    // Still look up the district (the shop application saves it), just not the address text.
    const keepName = kept !== null && Math.abs(kept[0] - lat) < 0.0003 && Math.abs(kept[1] - lng) < 0.0003;
    reverseGeocode(lat, lng, keepName);
  }

  function jumpTo(lat: number, lng: number, keepLabel = false) {
    keepLabelAt.current = keepLabel ? [lat, lng] : null;
    // A pending reverse-geocode for the old spot must not land on top of the new name.
    if (keepLabel) geocodeRequestId.current++;
    setPosition([lat, lng]);
    if (mapRef.current) focusOn(mapRef.current, lat, lng);
  }

  function handleUseCurrentLocation() {
    setLocating(true);
    setError('');
    setShowSuggestions(false);
    requestCurrentLocation(
      (loc) => {
        jumpTo(loc.lat, loc.lng);
        setAddress(loc.address);
        setDistrict(loc.district);
        setLocating(false);
      },
      () => {
        setError('Could not get your location. Check your browser’s location permission and try again.');
        setLocating(false);
      }
    );
  }

  // Live autocomplete suggestions while typing (debounced 250ms)
  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (parseCoordsFromMapsLink(text)) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (text.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    setShowSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const cleaned = cleanLocationQuery(text);
        let places = await searchPlacesAroundDavao(cleaned);
        if (places.length === 0 && cleaned !== text) {
          places = await searchPlacesAroundDavao(text);
        }
        setSearchResults(places.slice(0, 8));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  async function handleSearchSubmit() {
    const text = query.trim();
    if (!text) return;
    setError('');

    const parsed = parseCoordsFromMapsLink(text);
    if (parsed) {
      jumpTo(parsed.lat, parsed.lng);
      reverseGeocode(parsed.lat, parsed.lng);
      setShowSuggestions(false);
      return;
    }

    if (searchResults.length > 0) {
      handlePickSearchResult(searchResults[0]);
      return;
    }

    const cleaned = cleanLocationQuery(text);

    setSearching(true);
    try {
      let data = await searchPlacesAroundDavao(cleaned);
      if (data.length === 0 && cleaned !== text) {
        data = await searchPlacesAroundDavao(text);
      }

      if (data.length === 0) {
        setError("Couldn't find that place. Try typing a street name or landmark (e.g. Pichon St, Almendras Gym).");
        setShowSuggestions(false);
      } else {
        const { lat, lng, display_name } = data[0];
        jumpTo(lat, lng, true);
        setAddress(display_name ?? cleaned);
        setSearchResults(data);
        setShowSuggestions(false);
      }
    } catch {
      setError('Something went wrong searching that. Please try again.');
      setShowSuggestions(false);
    } finally {
      setSearching(false);
    }
  }

  function handlePickSearchResult(r: { lat: number; lng: number; display_name: string }) {
    jumpTo(r.lat, r.lng, true);
    setAddress(r.display_name);
    setSearchResults([]);
    setShowSuggestions(false);
  }

  function handlePickRecent(loc: RecentLocation) {
    jumpTo(loc.lat, loc.lng, true);
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
    blurTimeout.current = setTimeout(() => setShowSuggestions(false), 200);
  }

  function handleInputFocus() {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setShowSuggestions(true);
  }

  const suggestionsVisible =
    showSuggestions &&
    (searching || searchResults.length > 0 || (query.trim().length >= 2) || (!query.trim() && recents.length > 0));

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
