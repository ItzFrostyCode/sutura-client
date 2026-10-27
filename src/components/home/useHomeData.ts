'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { BOOT_CLASS } from '@/lib/bootSplash';
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
  const [heroSearch, setHeroSearch] = useState('');

  const [stores, setStores] = useState<StoreResult[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);


  // Detect the visitor's location on arrival (adviser request, after
  // tarakape.cc): the browser's own permission prompt appears on the first
  // visit; afterwards a saved spot is reused and an "allowed" device just
  // refreshes silently. Declined → we say so and offer the manual picker.
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('locating');

  useEffect(() => {
    // The landing splash (LocationSplash) is detecting right now; it hands
    // the result over via applyLocation, so don't prompt a second time.
    const splashDetecting = document.documentElement.classList.contains(BOOT_CLASS);
    const saved = getSavedLocation();
    if (splashDetecting) {
      // stay 'locating' until the splash resolves
    } else if (saved) {
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
    // Featured spotlight: Premium shops only (active, unexpired Premium
    // subscription — Store::scopePremiumActive), in the server's default
    // order (featured first, then ratings) — deliberately not distance.
    // "Shops near you" (HomeStoresGrid) runs its own location + filter query.
    api.get('/public/stores', { params: { per_page: 8, premium_only: 1 } })
      .then((res) => setStores(res.data.data ?? []))
      .catch(() => setStores([]))
      .finally(() => setStoresLoading(false));
  }, []);

  const applyLocation = useCallback((loc: SavedLocation) => {
    setLocation(loc);
    setLocationStatus('ready');
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
    applyLocation,
    stores,
    storesLoading,
    heroSearch,
    setHeroSearch,
    handleHeroSearch,
  };
}
