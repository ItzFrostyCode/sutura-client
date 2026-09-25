import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { SavedLocation, RecentLocation } from '@/lib/customerLocation';
import { getRecentLocations, addRecentLocation } from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery } from '@/lib/parseLocationInput';
import api from '@/lib/axios';
import { isStoreOpen } from '@/lib/storeStatus';
import { type StoreMapPin, DAVAO_CENTER } from './locationPickerTypes';

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

  const [stores, setStores] = useState<StoreMapPin[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreMapPin | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

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

  useEffect(() => {
    api.get('/public/stores', { params: { per_page: 50 } })
      .then((res) => {
        const list: StoreMapPin[] = [];
        const raw = res.data?.data ?? [];
        for (const s of raw) {
          const open = isStoreOpen(s.operating_hours);
          if (Array.isArray(s.branches)) {
            for (const b of s.branches) {
              if (
                b.latitude != null &&
                b.longitude != null &&
                !Number.isNaN(Number(b.latitude)) &&
                !Number.isNaN(Number(b.longitude))
              ) {
                list.push({
                  id: b.id,
                  slug: s.slug,
                  name: s.name,
                  branchName: b.name,
                  isMain: !!b.is_main,
                  logoPath: s.logo_path,
                  district: s.district || b.city || null,
                  address: b.address || s.address || null,
                  latitude: Number(b.latitude),
                  longitude: Number(b.longitude),
                  isOpen: open,
                });
              }
            }
          }
        }
        setStores(list);
      })
      .catch(() => setStores([]));
  }, []);

  const filteredStores = stores.filter((st) => {
    if (selectedDistrict !== 'all' && st.district && !st.district.toLowerCase().includes(selectedDistrict.toLowerCase())) {
      return false;
    }
    if (statusFilter === 'online' && !st.isOpen) return false;
    if (statusFilter === 'offline' && st.isOpen) return false;
    return true;
  });

  function handleSelectStore(st: StoreMapPin) {
    setSelectedStore(st);
    setPosition([st.latitude, st.longitude]);
    setAddress(`${st.name} (${st.branchName}) - ${st.address || st.district || 'Davao City'}`);
    if (st.district) setDistrict(st.district);
    mapRef.current?.flyTo([st.latitude, st.longitude], 16, { animate: true });
  }

  function reverseGeocode(lat: number, lng: number) {
    const requestId = ++geocodeRequestId.current;
    setReverseLoading(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (requestId !== geocodeRequestId.current) return;
        setAddress(data?.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
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
    if (selectedStore) {
      const dLat = Math.abs(lat - selectedStore.latitude);
      const dLng = Math.abs(lng - selectedStore.longitude);
      if (dLat > 0.001 || dLng > 0.001) {
        setSelectedStore(null);
      }
    }
    reverseGeocode(lat, lng);
  }

  function jumpTo(lat: number, lng: number) {
    setPosition([lat, lng]);
    mapRef.current?.flyTo([lat, lng], 16);
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
    const geocode = (q: string) =>
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&countrycodes=ph`)
        .then((res) => res.json());

    setSearching(true);
    try {
      let data = await geocode(cleaned);
      const firstSegment = cleaned.split(',')[0].trim();
      if ((!Array.isArray(data) || data.length === 0) && firstSegment && firstSegment !== cleaned) {
        data = await geocode(firstSegment);
      }

      if (!Array.isArray(data) || data.length === 0) {
        setError("Couldn't find that place. Try pasting the full Google Maps link, or a more specific address.");
        setShowSuggestions(false);
      } else if (data.length === 1) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        jumpTo(lat, lng);
        setAddress(data[0].display_name ?? cleaned);
        setShowSuggestions(false);
      } else {
        setSearchResults(
          data.map((d: { lat: string; lon: string; display_name: string }) => ({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            display_name: d.display_name,
          }))
        );
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
    selectedStore,
    setSelectedStore,
    selectedDistrict,
    setSelectedDistrict,
    statusFilter,
    setStatusFilter,
    showFilterDropdown,
    setShowFilterDropdown,
    filteredStores,
    suggestionsVisible,
    handleSelectStore,
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
