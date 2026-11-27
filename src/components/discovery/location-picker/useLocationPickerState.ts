import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { SavedLocation, RecentLocation } from '@/lib/customerLocation';
import { getRecentLocations, addRecentLocation } from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery, isGoogleMapsLink } from '@/lib/parseLocationInput';
import api from '@/lib/axios';
import { focusOn } from '@/lib/mapFocus';
import { DAVAO_CENTER } from './locationPickerTypes';
import { reverseGeocodeCoords, searchPlacesAroundDavao } from '@/lib/geocoding';
import { rankAddressHits } from './addressMatch';


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

  // `override`: search for this text right away (a popular-place chip) instead of the box.
  async function handleSearchSubmit(override?: string) {
    const text = (override ?? query).trim();
    if (!text) return;
    if (override) setQuery(override);
    setError('');
    setSearchResults([]);

    // 1–2. Raw "lat, lng" or a full Google Maps link with coordinates in it.
    const parsed = parseCoordsFromMapsLink(text);
    if (parsed) {
      jumpTo(parsed.lat, parsed.lng);
      reverseGeocode(parsed.lat, parsed.lng);
      setShowSuggestions(false);
      return;
    }

    // 3. A short link (maps.app.goo.gl) or a Google link without coordinates:
    // the server follows the redirect (the browser can't, cross-origin).
    if (isGoogleMapsLink(text)) {
      setSearching(true);
      setShowSuggestions(false);
      try {
        const url = /^https?:\/\//i.test(text) ? text : `https://${text}`;
        const res = await api.post('/public/resolve-map-url', { url });
        if (res.data?.success) {
          const { lat, lng } = res.data as { lat: number; lng: number };
          jumpTo(lat, lng);
          reverseGeocode(lat, lng);
        } else {
          setError("Couldn't read a location from that link. Open it in Google Maps, tap Share, and paste the link again, or type the address.");
        }
      } catch {
        setError("Couldn't open that link right now. Please try again, or type the address.");
      } finally {
        setSearching(false);
      }
      return;
    }

    // 4. Plain text: geocode the address.

    const cleaned = cleanLocationQuery(text);

    setSearching(true);
    try {
      // Two searches, side by side. The street / place part alone: with the
      // whole address ("A. Pichon St, Poblacion District, Davao City") the
      // geocoder can latch onto "Davao City" and return City Hall offices.
      // And the whole address: a long street ("San Pedro Street") is split
      // by barangay in the map data, and only the full text finds the right
      // piece. rankAddressHits then prefers hits in the barangay/district
      // that was typed, so the pin lands where the address says.
      const firstSegment = cleaned.split(',')[0].trim();
      const [streetHits, fullHits] = await Promise.all([
        firstSegment && firstSegment !== cleaned ? searchPlacesAroundDavao(firstSegment) : Promise.resolve([]),
        searchPlacesAroundDavao(cleaned),
      ]);
      const { ranked: data, confident } = rankAddressHits([...streetHits, ...fullHits], cleaned);

      if (data.length === 0) {
        setError("Couldn't find that place. Try pasting the full Google Maps link, or a more specific address.");
        setShowSuggestions(false);
      } else if (data.length === 1 || confident) {
        const { lat, lng, display_name } = data[0];
        jumpTo(lat, lng, true);
        setAddress(display_name ?? cleaned);
        setShowSuggestions(false);
      } else {
        setSearchResults(data.slice(0, 8));
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
    blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150);
  }

  function handleInputFocus() {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setShowSuggestions(true);
  }

  // An empty box shows recents and popular places; results show once a search has run.
  const suggestionsVisible = showSuggestions && (searchResults.length > 0 || !query.trim());

  function zoomBy(delta: number) {
    const map = mapRef.current;
    if (map) map.setZoom(map.getZoom() + delta);
  }

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
    zoomBy,
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
