'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  checkLocationPermission,
  getSavedLocation,
  LOCATION_CHANGED_EVENT,
  requestCurrentLocation,
  type SavedLocation,
} from '@/lib/customerLocation';

export type LocationStatus = 'locating' | 'ready' | 'denied';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { StoreResult } from './homeTypes';

export function useHomeData() {
  const router = useRouter();
  const [items, setItems] = useState<CatalogItemResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');

  const [stores, setStores] = useState<StoreResult[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  // Real "bestseller" signal (order count), not a fabricated ranking —
  // same sort_by=top_sales /search already offers.
  const [trendingItems, setTrendingItems] = useState<CatalogItemResult[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Detect the visitor's location on arrival (adviser request, after
  // tarakape.cc): the browser's own permission prompt appears on the first
  // visit; afterwards a saved spot is reused and an "allowed" device just
  // refreshes silently. Declined → we say so and offer the manual picker.
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('locating');

  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setLocation(saved);
      setLocationStatus('ready');
    } else {
      checkLocationPermission().then((permission) => {
        if (permission === 'denied') {
          setLocationStatus('denied');
          return;
        }
        requestCurrentLocation(
          (loc) => { setLocation(loc); setLocationStatus('ready'); },
          () => setLocationStatus('denied'),
        );
      });
    }

    // Picked again elsewhere (the /location page, the search picker).
    const onChange = (e: Event) => {
      const loc = (e as CustomEvent<SavedLocation>).detail;
      if (loc) { setLocation(loc); setLocationStatus('ready'); }
    };
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    // Featured spotlight: the server's default order (featured first, then
    // ratings) — deliberately not distance. "Stores near you" (HomeStoresGrid)
    // runs its own location + filter query.
    api.get('/public/stores', { params: { per_page: 8 } })
      .then((res) => setStores(res.data.data ?? []))
      .catch(() => setStores([]))
      .finally(() => setStoresLoading(false));
  }, []);

  useEffect(() => {
    api.get('/public/catalog-items', { params: { per_page: 8, sort_by: 'top_sales' } })
      .then((res) => setTrendingItems(res.data.data ?? []))
      .catch(() => setTrendingItems([]))
      .finally(() => setTrendingLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/public/catalog-items', { params: { per_page: 48 } })
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!getSavedLocation()) {
      requestCurrentLocation();
    }
    const query = heroSearch.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  return {
    location,
    locationStatus,
    items,
    loading,
    stores,
    storesLoading,
    trendingItems,
    trendingLoading,
    heroSearch,
    setHeroSearch,
    handleHeroSearch,
  };
}
