'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { applyCategoryFilter } from '@/lib/garmentCategories';
import {
  getSavedLocation,
  saveLocation,
  getOldLocation,
  swapLocations,
  haversineKm,
  type SavedLocation,
} from '@/lib/customerLocation';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { useCloseOnDesktop } from '@/hooks/useCloseOnDesktop';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';
import {
  RelatedStore,
  SearchServiceResult,
  FilterTabKey,
  SearchActiveTab,
} from '../types';

export function useSearchData() {
  const router = useRouter();
  const gate = useGuestGatedHref();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') ?? searchParams.get('search') ?? '');
  const effectiveQ = q.trim();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Display-only echo of a clicked nav category (e.g. "All Suits") — NOT a
  // real filter value. Never merged into `effectiveQ`/API params, so it
  // can't accidentally AND-narrow results away from a category match; the
  // search input just falls back to showing it when `q` itself is empty
  // (see search/page.tsx), and typing anything replaces it immediately.
  const [categoryLabel, setCategoryLabel] = useState(searchParams.get('qlabel') ?? '');

  const [specialization, setSpecialization] = useState(
    searchParams.get('specialization') ?? searchParams.get('category') ?? ''
  );
  const [department, setDepartment] = useState(searchParams.get('department') ?? '');
  const [color, setColor] = useState(searchParams.get('color') ?? '');
  const [openNow, setOpenNow] = useState(
    searchParams.get('openNow') === 'true' || searchParams.get('open_now') === '1'
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? '');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const nextQ = searchParams.get('q') ?? searchParams.get('search') ?? '';
    const nextCat = searchParams.get('specialization') ?? searchParams.get('category') ?? '';
    const nextColor = searchParams.get('color') ?? '';

    if (nextQ) {
      setQ(nextQ);
    } else {
      setQ('');
    }
    setCategoryLabel(searchParams.get('qlabel') ?? '');

    setSpecialization(nextCat);
    setColor(nextColor);

    // Header links (Men/Women/Wedding/Office & Teams) carry a "department"
    // param alongside "category" — sync it so the sidebar's Department
    // selector reflects what was actually clicked instead of always
    // falling back to "All".
    const nextDept = searchParams.get('department') ?? '';
    if (nextDept) setDepartment(nextDept);

    const nextDistrict = searchParams.get('district') ?? '';
    if (nextDistrict) setDistrict(nextDistrict);

    const nextOpen = searchParams.get('openNow') === 'true' || searchParams.get('open_now') === '1';
    setOpenNow(nextOpen);

    const nextTab = searchParams.get('tab');
    if (nextTab === 'services' || nextTab === 'service') setActiveTab('services');
    else if (nextTab === 'showroom' || nextTab === 'catalog') setActiveTab('showroom');
    else if (nextTab === 'store' || nextTab === 'stores') setActiveTab('store');
    else if (nextCat) setActiveTab('showroom');
    else setActiveTab('store');
  }, [searchParams]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);


  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [oldLocation, setOldLocation] = useState<SavedLocation | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<SearchActiveTab>(
    initialTab === 'services' || initialTab === 'service'
      ? 'services'
      : initialTab === 'showroom' || initialTab === 'catalog'
        ? 'showroom'
        : initialTab === 'store' || initialTab === 'stores'
          ? 'store'
          : searchParams.get('category') || searchParams.get('specialization')
            ? 'showroom'
            : 'store'
  );

  const [stores, setStores] = useState<RelatedStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [services, setServices] = useState<SearchServiceResult[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesTotal, setServicesTotal] = useState(0);

  const [items, setItems] = useState<CatalogItemResult[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFabric, setShowFabric] = useState(false);

  useEffect(() => {
    const loc = getSavedLocation();
    setSavedLocation(loc);
    setOldLocation(getOldLocation());
    if (loc?.lat && loc?.lng) {
      setUserCoords({ lat: loc.lat, lng: loc.lng });
    }
    const urlDistrict = searchParams.get('district');
    if (urlDistrict) {
      setDistrict(urlDistrict);
    }
  }, [searchParams]);

  function handleToggleOldLocation() {
    const result = swapLocations();
    if (result?.current) {
      setSavedLocation(result.current);
      setUserCoords({ lat: result.current.lat, lng: result.current.lng });
      setDistrict(result.current.district || '');
      setOldLocation(result.old);
    }
  }

  function handleSortNearest() {
    if (sortBy === 'distance') {
      setSortBy('');
      return;
    }
    if (userCoords) {
      setSortBy('distance');
      return;
    }
    if (!navigator.geolocation) {
      alert('Location is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setSortBy('distance');
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Filter Drawer draft states
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  // The drawer's own trigger button is sm:hidden (SearchWebFilterSidebar
  // takes over at sm+) — without this, resizing past 640px while the
  // drawer is open left it stuck open on top of the now-visible sidebar.
  useCloseOnDesktop(() => setFilterPanelOpen(false), 640);
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTabKey>('specialization');
  const [draftSpecialization, setDraftSpecialization] = useState('');
  const [draftColor, setDraftColor] = useState('');
  const [draftOpenNow, setDraftOpenNow] = useState(false);
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftMinRating, setDraftMinRating] = useState('');
  const [draftDistrict, setDraftDistrict] = useState('');

  function openFilterPanel() {
    setDraftSpecialization(specialization);
    setDraftColor(color);
    setDraftOpenNow(openNow);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftMinRating(minRating);
    setDraftDistrict(district);
    setActiveFilterTab('specialization');
    setFilterPanelOpen(true);
  }

  function applyFilterPanel() {
    setSpecialization(draftSpecialization);
    setColor(draftColor);
    setOpenNow(draftOpenNow);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setMinRating(draftMinRating);
    setDistrict(draftDistrict);
    setFilterPanelOpen(false);
  }

  function resetFilterPanel() {
    setSpecialization('');
    setColor('');
    setOpenNow(false);
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setDistrict('');
    setDraftSpecialization('');
    setDraftColor('');
    setDraftOpenNow(false);
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftMinRating('');
    setDraftDistrict('');
  }

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [effectiveQ, specialization, color, openNow, minPrice, maxPrice, minRating, district, sortBy]);

  // Catalog items fetch
  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string | number> = { per_page: 30, page };
      if (effectiveQ.trim()) params.q = effectiveQ.trim();
      if (specialization) applyCategoryFilter(params, specialization);
      if (color) params.color = color;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minRating) params.min_rating = minRating;
      if (district) params.district = district;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }
      if (sortBy) params.sort_by = sortBy;

      api
        .get('/public/catalog-items', { params })
        .then((res) => {
          setItems(res.data.data ?? []);
          setTotal(res.data.meta?.total ?? 0);
          setLastPage(res.data.meta?.last_page ?? 1);
        })
        .catch(() => {
          setItems([]);
          setTotal(0);
          setLastPage(1);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [effectiveQ, specialization, color, minPrice, maxPrice, minRating, district, sortBy, page, userCoords]);

  // Nearby stores fetch (aligned with /stores filter logic)
  useEffect(() => {
    setStoresLoading(true);
    const handle = setTimeout(() => {
      const params: Record<string, string | number> = { per_page: 30 };
      if (effectiveQ.trim()) params.q = effectiveQ.trim();
      if (district) params.district = district;
      if (specialization) params.specialization = specialization;
      if (openNow) params.open_now = 1;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        params.sort_by = 'distance';
      }

      api
        .get('/public/stores', { params })
        .then((res) => {
          let list: RelatedStore[] = res.data.data ?? [];
          if (userCoords) {
            list = list.map((store) => {
              if (store.distance_km != null) return store;
              let minKm: number | null = null;
              if (store.branches) {
                for (const b of store.branches) {
                  if (b.latitude && b.longitude) {
                    const d = haversineKm(userCoords.lat, userCoords.lng, Number(b.latitude), Number(b.longitude));
                    if (minKm === null || d < minKm) minKm = d;
                  }
                }
              }
              return { ...store, distance_km: minKm };
            });
            list.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
          }
          setStores(list);
        })
        .catch(() => {
          setStores([]);
        })
        .finally(() => setStoresLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [effectiveQ, district, specialization, openNow, userCoords]);

  // Services fetch
  useEffect(() => {
    setServicesLoading(true);
    const handle = setTimeout(() => {
      const params: Record<string, string | number> = { per_page: 30 };
      const qSearch = [effectiveQ.trim(), specialization ? specialization.replace(/_/g, ' ') : ''].filter(Boolean).join(' ');
      if (qSearch) params.q = qSearch;
      if (district) params.district = district;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }
      if (sortBy) params.sort_by = sortBy;

      api
        .get('/public/services', { params })
        .then((res) => {
          setServices(res.data.data ?? []);
          setServicesTotal(res.data.meta?.total ?? res.data.data?.length ?? 0);
        })
        .catch(() => {
          setServices([]);
          setServicesTotal(0);
        })
        .finally(() => setServicesLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [effectiveQ, district, specialization, userCoords, sortBy]);

  const activeFilterCount = [specialization, color, openNow ? 'open' : '', minPrice || maxPrice, minRating, district].filter(Boolean).length;

  return {
    router,
    gate,
    searchParams,
    q,
    setQ,
    effectiveQ,
    categoryLabel,
    setCategoryLabel,
    searchInputRef,
    specialization,
    setSpecialization,
    category: specialization,
    setCategory: setSpecialization,
    department,
    setDepartment,
    color,
    setColor,
    openNow,
    setOpenNow,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    minRating,
    setMinRating,
    district,
    setDistrict,
    sortBy,
    setSortBy,
    page,
    setPage,
    locationPickerOpen,
    setLocationPickerOpen,
    savedLocation,
    setSavedLocation,
    oldLocation,
    userCoords,
    locating,
    handleToggleOldLocation,
    handleSortNearest,
    activeTab,
    setActiveTab,
    stores,
    storesLoading,
    services,
    servicesLoading,
    servicesTotal,
    items,
    total,
    lastPage,
    loading,
    showFabric,
    setShowFabric,
    filterPanelOpen,
    setFilterPanelOpen,
    activeFilterTab,
    setActiveFilterTab,
    draftSpecialization,
    setDraftSpecialization,
    draftColor,
    setDraftColor,
    draftOpenNow,
    setDraftOpenNow,
    draftMinPrice,
    setDraftMinPrice,
    draftMaxPrice,
    setDraftMaxPrice,
    draftMinRating,
    setDraftMinRating,
    draftDistrict,
    setDraftDistrict,
    openFilterPanel,
    applyFilterPanel,
    resetFilterPanel,
    activeFilterCount,
    saveLocation,
  };
}
