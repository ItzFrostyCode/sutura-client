'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
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
import { SuggestedHub, DAVAO_LANDMARKS } from '../types';

export function useLocationPageState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outgoingQ = searchParams.get('q') ?? '';

  const [activeTab, setActiveTab] = useState<'recent' | 'suggested'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; display_name: string }[]>([]);
  const [searchError, setSearchError] = useState('');

  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [recents, setRecents] = useState<RecentLocation[]>([]);
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [currentAddressPreview, setCurrentAddressPreview] = useState('');

  const [storeHubs, setStoreHubs] = useState<SuggestedHub[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [hubCategory, setHubCategory] = useState<'all' | 'stores' | 'malls' | 'districts'>('all');

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

  useEffect(() => {
    setLoadingStores(true);
    api
      .get('/public/stores')
      .then((res) => {
        const stores = res.data?.data ?? [];
        const hubs: SuggestedHub[] = [];
        stores.forEach(
          (store: {
            name: string;
            address?: string;
            city?: string;
            branches?: Array<{
              name?: string;
              address?: string;
              district?: string;
              latitude?: string | number;
              longitude?: string | number;
            }>;
          }) => {
            if (Array.isArray(store.branches)) {
              store.branches.forEach((b) => {
                const lat = typeof b.latitude === 'string' ? parseFloat(b.latitude) : Number(b.latitude);
                const lng = typeof b.longitude === 'string' ? parseFloat(b.longitude) : Number(b.longitude);
                if (
                  lat != null &&
                  lng != null &&
                  !isNaN(lat) &&
                  !isNaN(lng) &&
                  lat >= 6.85 &&
                  lat <= 7.4 &&
                  lng >= 125.3 &&
                  lng <= 125.8
                ) {
                  hubs.push({
                    name: `${store.name}${b.name ? ` (${b.name})` : ''}`,
                    address: `${b.address || store.address || ''}, ${b.district || 'Davao City'}`.replace(/^,\s*/, ''),
                    district: b.district || store.city || 'Davao City',
                    lat,
                    lng,
                    type: 'tailor_store',
                  });
                }
              });
            }
          }
        );
        setStoreHubs(hubs);
      })
      .catch(() => {})
      .finally(() => setLoadingStores(false));
  }, []);

  const dynamicSuggested = useMemo(() => {
    const combined = [...storeHubs, ...DAVAO_LANDMARKS];
    const refLat = savedLocation?.lat ?? 7.0731;
    const refLng = savedLocation?.lng ?? 125.6128;

    const filtered = combined.filter((item) => {
      if (hubCategory === 'stores') return item.type === 'tailor_store';
      if (hubCategory === 'malls') return item.type === 'mall';
      if (hubCategory === 'districts') return item.type === 'district' || item.type === 'landmark';
      return true;
    });

    return filtered.sort((a, b) => {
      const distA = haversineKm(refLat, refLng, a.lat, a.lng);
      const distB = haversineKm(refLat, refLng, b.lat, b.lng);
      return distA - distB;
    });
  }, [storeHubs, savedLocation, hubCategory]);

  function handleSelectLocation(loc: SavedLocation) {
    saveLocationWithHistory(loc);
    router.push(outgoingQ ? `/search?q=${encodeURIComponent(outgoingQ)}` : '/search');
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
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          handleSelectLocation({
            lat: latitude,
            lng: longitude,
            address: data?.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            district:
              data?.address?.suburb ||
              data?.address?.neighbourhood ||
              data?.address?.city_district ||
              'Davao City',
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
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${parsedCoords.lat}&lon=${parsedCoords.lng}`
        );
        const data = await res.json();
        handleSelectLocation({
          lat: parsedCoords.lat,
          lng: parsedCoords.lng,
          address: data?.display_name ?? text,
          district: data?.address?.suburb || 'Davao City',
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
      const cleaned = cleanLocationQuery(text);
      const isDavaoQuery = cleaned.toLowerCase().includes('davao');
      const queryText = isDavaoQuery ? cleaned : `${cleaned}, Davao City`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          queryText
        )}&viewbox=125.30,7.40,125.80,6.85&bounded=1&limit=8&countrycodes=ph`
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError('No places found around Davao City. Try a landmark, street, or choose on map.');
      } else {
        setSearchResults(
          data.map((d: { lat: string; lon: string; display_name: string }) => ({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            display_name: d.display_name,
          }))
        );
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
    activeTab,
    setActiveTab,
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
    storeHubs,
    loadingStores,
    hubCategory,
    setHubCategory,
    showSetHome,
    setShowSetHome,
    searchInputRef,
    handleSelectLocation,
    handleUseCurrentGps,
    handleSearch,
    getDistanceLabel,
    handleDeleteRecent,
    handleClearAllRecents,
    dynamicSuggested,
    saveHomeLocation,
    removeHomeLocation,
  };
}
