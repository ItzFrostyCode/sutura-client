'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SavedLocation, RecentLocation, HomeLocation } from '@/lib/customerLocation';
import {
  getSavedLocation,
  saveLocationWithHistory,
  getRecentLocations,
  removeRecentLocation,
  clearRecentLocations,
  getHomeLocation,
  saveHomeLocation,
  removeHomeLocation,
  haversineKm,
} from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery } from '@/lib/parseLocationInput';
import { reverseGeocodeCoords, searchPlacesAroundDavao } from '@/lib/geocoding';
import { withFocusParam } from '@/lib/mapFocus';

export function useLocationPageState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outgoingQ = searchParams.get('q') ?? '';
  // Where to go after a place is picked (e.g. the landing page). Same-site paths only.
  const rawReturnTo = searchParams.get('returnTo') ?? '';
  const returnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//') ? rawReturnTo : '';

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; display_name: string }[]>([]);
  const [searchError, setSearchError] = useState('');

  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [recents, setRecents] = useState<RecentLocation[]>([]);
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [currentAddressPreview, setCurrentAddressPreview] = useState('');

  const [showSetHome, setShowSetHome] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('mode') === 'map') {
      router.replace(
        outgoingQ
          ? `/map?q=${encodeURIComponent(outgoingQ)}&select=1&returnTo=/location&continueTo=/location`
          : '/map?select=1&returnTo=/location&continueTo=/location'
      );
    }
  }, [searchParams, router, outgoingQ]);

  const refreshData = useCallback(() => {
    const loc = getSavedLocation();
    setSavedLocation(loc);
    setRecents(getRecentLocations());
    setHomeLocation(getHomeLocation());
    if (loc?.address) setCurrentAddressPreview(loc.address);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  function handleSelectLocation(loc: SavedLocation) {
    saveLocationWithHistory(loc);
    const target = returnTo || (outgoingQ ? `/search?q=${encodeURIComponent(outgoingQ)}` : '/search');
    router.replace(withFocusParam(target));
  }

  function handleUseCurrentGps() {
    if (!navigator.geolocation) {
      setSearchError('Geolocation not supported.');
      return;
    }
    setLocatingCurrent(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await reverseGeocodeCoords(latitude, longitude);
          handleSelectLocation({
            lat: latitude,
            lng: longitude,
            address: res.address,
            district: res.district,
          });
        } catch {
          handleSelectLocation({
            lat: latitude,
            lng: longitude,
            address: `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            district: 'Davao City',
          });
        } finally {
          setLocatingCurrent(false);
        }
      },
      () => {
        setSearchError('Unable to get location. Check browser permissions.');
        setLocatingCurrent(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSearch() {
    const text = searchQuery.trim();
    if (!text) return;
    setSearchError('');
    setSearchResults([]);

    const parsedCoords = parseCoordsFromMapsLink(text);
    if (parsedCoords) {
      try {
        const res = await reverseGeocodeCoords(parsedCoords.lat, parsedCoords.lng);
        handleSelectLocation({
          lat: parsedCoords.lat,
          lng: parsedCoords.lng,
          address: res.address,
          district: res.district,
        });
      } catch {
        handleSelectLocation({
          lat: parsedCoords.lat,
          lng: parsedCoords.lng,
          address: text,
          district: 'Davao City',
        });
      }
      return;
    }

    setSearching(true);
    try {
      const places = await searchPlacesAroundDavao(text);
      if (!Array.isArray(places) || places.length === 0) {
        setSearchError('No places found around Davao City. Try a landmark, street, or choose on map.');
      } else {
        setSearchResults(places);
      }
    } catch {
      setSearchError('Connection error. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  function getDistanceLabel(lat: number, lng: number): string {
    const refLat = savedLocation?.lat ?? 7.0731;
    const refLng = savedLocation?.lng ?? 125.6128;
    return `${haversineKm(refLat, refLng, lat, lng).toFixed(2)} km`;
  }

  function handleDeleteRecent(lat: number, lng: number) {
    removeRecentLocation(lat, lng);
    setRecents(getRecentLocations());
  }

  function handleClearAllRecents() {
    clearRecentLocations();
    setRecents([]);
  }

  return {
    router,
    outgoingQ,
    returnTo,
    searchQuery,
    setSearchQuery,
    searching,
    searchResults,
    setSearchResults,
    searchError,
    setSearchError,
    savedLocation,
    recents,
    homeLocation,
    setHomeLocation,
    locatingCurrent,
    currentAddressPreview,
    showSetHome,
    setShowSetHome,
    searchInputRef,
    handleSelectLocation,
    handleUseCurrentGps,
    handleSearch,
    getDistanceLabel,
    handleDeleteRecent,
    handleClearAllRecents,
    saveHomeLocation,
    removeHomeLocation,
  };
}
