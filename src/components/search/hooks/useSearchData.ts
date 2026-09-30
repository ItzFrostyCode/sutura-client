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
  requestCurrentLocation,
  LOCATION_CHANGED_EVENT,
  type SavedLocation,
} from '@/lib/customerLocation';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { useCloseOnDesktop } from '@/hooks/useCloseOnDesktop';
import type { CatalogItemResult } from '@/types/publicCatalog';
import {
  RelatedStore,
  SearchServiceResult,
  SearchPackageResult,
  FilterTabKey,
  SearchActiveTab,
} from '../types';
import { useToast } from '@/context/ToastContext';

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
  const initialTabVal = searchParams.get('tab');
  const initialDeptVal = searchParams.get('department') ?? '';
  const isInitialStoreTab =
    initialTabVal === 'store' ||
    initialTabVal === 'stores' ||
    (!initialTabVal && !searchParams.get('category') && !searchParams.get('specialization'));

  const [department, setDepartment] = useState(
    !isInitialStoreTab && (initialDeptVal.toLowerCase() === 'services' || initialDeptVal.toLowerCase() === 'service')
      ? ''
      : initialDeptVal
  );
  // Canonical Categories.md taxonomy — Subcategory/Structure/Garment Type,
  // the levels between Department and the leaf item. Additive to (not a
  // replacement for) `specialization` above, which stays as a legacy alias
  // for old bookmarked/shared links (see the URL-sync effect below).
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') ?? '');
  const [structure, setStructure] = useState(searchParams.get('structure') ?? '');
  const [garmentType, setGarmentType] = useState(searchParams.get('garment_type') ?? '');
  // Canonical Services.md taxonomy — Service Category/Service Type.
  const [serviceCategory, setServiceCategory] = useState(searchParams.get('service_category') ?? '');
  const [serviceType, setServiceType] = useState(searchParams.get('service_type') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? '');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const nextQ = searchParams.get('q') ?? searchParams.get('search') ?? '';
    const nextCat = searchParams.get('specialization') ?? searchParams.get('category') ?? '';

    if (nextQ !== null && nextQ !== undefined) {
      setQ(nextQ);
    }
    setCategoryLabel(searchParams.get('qlabel') ?? '');

    setSpecialization(nextCat);

    const nextTab = searchParams.get('tab');
    let resolvedTab: SearchActiveTab = 'store';
    if (nextTab === 'services' || nextTab === 'service') {
      setActiveTab('services');
      setFilterPanelOpen(false);
      resolvedTab = 'services';
    } else if (nextTab === 'showroom' || nextTab === 'catalog') {
      setActiveTab('showroom');
      resolvedTab = 'showroom';
    } else if (nextTab === 'store' || nextTab === 'stores') {
      setActiveTab('store');
      resolvedTab = 'store';
    } else if (nextCat) {
      setActiveTab('showroom');
      resolvedTab = 'showroom';
    } else {
      setActiveTab('store');
      resolvedTab = 'store';
    }

    // Header links (Men/Women/Kids) carry a "department" param alongside
    // "category" — sync it so the sidebar's Department selector reflects
    // what was actually clicked instead of always falling back to "All".
    const nextDept = searchParams.get('department') ?? '';
    if (nextDept.toLowerCase() === 'services' || nextDept.toLowerCase() === 'service' || resolvedTab === 'services') {
      setDepartment('');
    } else {
      setDepartment(nextDept);
    }

    setSubcategory(searchParams.get('subcategory') ?? '');
    setStructure(searchParams.get('structure') ?? '');
    setGarmentType(searchParams.get('garment_type') ?? '');
    setServiceCategory(searchParams.get('service_category') ?? '');
    setServiceType(searchParams.get('service_type') ?? '');

    const nextDistrict = searchParams.get('district') ?? '';
    setDistrict(nextDistrict);
  }, [searchParams]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [oldLocation, setOldLocation] = useState<SavedLocation | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationPromptDismissed, setLocationPromptDismissed] = useState(false);
  const toast = useToast();

  // Sync with global location change events across components.
  // Note: user coordinates are used solely for distance display and proximity sorting,
  // never to restrict search results to a single district.
  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent<SavedLocation>;
      if (customEvent.detail) {
        setSavedLocation(customEvent.detail);
        setUserCoords({ lat: customEvent.detail.lat, lng: customEvent.detail.lng });
      }
    };

    window.addEventListener(LOCATION_CHANGED_EVENT, handleLocationChange);
    return () => {
      window.removeEventListener(LOCATION_CHANGED_EVENT, handleLocationChange);
    };
  }, []);

  const handleRequestLocation = () => {
    setLocating(true);
    requestCurrentLocation(
      (loc) => {
        setSavedLocation(loc);
        setUserCoords({ lat: loc.lat, lng: loc.lng });
        setLocating(false);
      },
      () => {
        setLocating(false);
      }
    );
  };

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
  const [packages, setPackages] = useState<SearchPackageResult[]>([]);

  const [items, setItems] = useState<CatalogItemResult[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

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
      setOldLocation(result.old);
    }
  }

  function handleTabChange(nextTab: SearchActiveTab) {
    setActiveTab(nextTab);
    if (nextTab === 'services') {
      setFilterPanelOpen(false);
    }
    const params = new URLSearchParams(searchParams.toString());
    // Canonicalize outgoing URL: internal 'showroom' → public-facing 'catalog'
    // so the address bar always shows ?tab=catalog (matching the tab label).
    // Both values are accepted on read (see initialTab resolution above).
    params.set('tab', nextTab === 'showroom' ? 'catalog' : nextTab);
    const trimmed = q.trim();
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }

    const currentDept = (params.get('department') || department).toLowerCase();
    // 1. Department 'services' only belongs to the Stores tab.
    // When switching to Catalog or Services, immediately remove it so results aren't blocked.
    if (currentDept === 'services' || currentDept === 'service') {
      if (nextTab === 'showroom' || nextTab === 'services') {
        params.delete('department');
        setDepartment('');
        setDraftDepartment('');
      }
    }

    // 2. Services tab doesn't use Department (services use Service Category/Type).
    // Ensure department doesn't pollute the Services tab.
    if (nextTab === 'services') {
      params.delete('department');
      setDepartment('');
      setDraftDepartment('');
    }

    // 3. Catalog-only filters shouldn't pollute Services or Stores
    if (nextTab === 'services' || nextTab === 'store') {
      params.delete('subcategory');
      params.delete('structure');
      params.delete('garment_type');
      setSubcategory('');
      setDraftSubcategory('');
      setStructure('');
      setDraftStructure('');
      setGarmentType('');
      setDraftGarmentType('');
    }

    // 4. Service-only filters shouldn't pollute Stores or Catalog
    if (nextTab === 'store' || nextTab === 'showroom') {
      params.delete('service_category');
      params.delete('service_type');
      setServiceCategory('');
      setServiceType('');
    }

    setPage(1);
    router.replace(`/search?${params.toString()}`, { scroll: false });
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
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Location is not supported by your browser.');
      return;
    }
    setLocating(true);
    requestCurrentLocation(
      (loc) => {
        setSavedLocation(loc);
        setUserCoords({ lat: loc.lat, lng: loc.lng });
        setSortBy('distance');
        setLocating(false);
        toast.success(`Showing stores nearest to ${loc.district || 'you'}.`);
      },
      () => {
        setLocating(false);
        toast.error('Unable to retrieve location. Please check browser permissions.');
      }
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
  const [draftDepartment, setDraftDepartment] = useState('');
  const [draftSubcategory, setDraftSubcategory] = useState('');
  const [draftStructure, setDraftStructure] = useState('');
  const [draftGarmentType, setDraftGarmentType] = useState('');
  const [draftServiceCategory, setDraftServiceCategory] = useState('');
  const [draftServiceType, setDraftServiceType] = useState('');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftMinRating, setDraftMinRating] = useState('');
  const [draftDistrict, setDraftDistrict] = useState('');

  function openFilterPanel() {
    setDraftSpecialization(specialization);
    setDraftDepartment(department);
    setDraftSubcategory(subcategory);
    setDraftStructure(structure);
    setDraftGarmentType(garmentType);
    setDraftServiceCategory(serviceCategory);
    setDraftServiceType(serviceType);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftMinRating(minRating);
    setDraftDistrict(district);
    setActiveFilterTab('specialization');
    setFilterPanelOpen(true);
  }

  function applyFilterPanel() {
    setSpecialization(draftSpecialization);
    setDepartment(draftDepartment);
    setSubcategory(draftSubcategory);
    setStructure(draftStructure);
    setGarmentType(draftGarmentType);
    setServiceCategory(draftServiceCategory);
    setServiceType(draftServiceType);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setMinRating(draftMinRating);
    setDistrict(draftDistrict);
    setFilterPanelOpen(false);
  }

  function resetFilterPanel() {
    setSpecialization('');
    setDepartment('');
    setSubcategory('');
    setStructure('');
    setGarmentType('');
    setServiceCategory('');
    setServiceType('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setDistrict('');
    setDraftSpecialization('');
    setDraftDepartment('');
    setDraftSubcategory('');
    setDraftStructure('');
    setDraftGarmentType('');
    setDraftServiceCategory('');
    setDraftServiceType('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftMinRating('');
    setDraftDistrict('');
  }

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [effectiveQ, specialization, minPrice, maxPrice, minRating, district, sortBy]);

  // Catalog items fetch
  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string | number> = { per_page: 30, page };
      if (effectiveQ.trim()) params.q = effectiveQ.trim();
      // Canonical garment_type (from the new cascading filter) wins over
      // the legacy specialization->garment_type/q mapping when both are
      // somehow present — specialization stays purely for old links.
      if (garmentType) {
        params.garment_type = garmentType;
      } else if (specialization) {
        applyCategoryFilter(params, specialization);
      }
      if (subcategory) params.subcategory = subcategory;
      if (structure) params.garment_structure = structure;
      if (department && department.toLowerCase() !== 'services' && department.toLowerCase() !== 'service') {
        params.department = department;
      }
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
  }, [effectiveQ, specialization, garmentType, subcategory, structure, department, minPrice, maxPrice, minRating, district, sortBy, page, userCoords]);

  // Nearby stores fetch (aligned with /stores filter logic)
  useEffect(() => {
    setStoresLoading(true);
    const handle = setTimeout(() => {
      const params: Record<string, string | number> = { per_page: 30 };
      if (effectiveQ.trim()) params.q = effectiveQ.trim();
      if (district) params.district = district;
      if (specialization) params.specialization = specialization;
      // Header nav's MEN/WOMEN/KIDS/SERVICES axis — 'services' is a real,
      // valid value here (unlike the catalog fetch's `department`, Store
      // has no department column of its own; the backend interprets
      // 'services' as "has any active service" instead of a garment tag).
      if (department) params.department = department;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
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
  }, [effectiveQ, district, specialization, department, userCoords, minPrice, maxPrice]);

  // Services fetch
  useEffect(() => {
    setServicesLoading(true);
    const handle = setTimeout(() => {
      const params: Record<string, string | number> = { per_page: 30 };
      // Canonical service_category/service_type filter directly — only
      // fall back to folding `specialization` into free text (legacy
      // behavior) when the new structured filters aren't set.
      const qSearch = [
        effectiveQ.trim(),
        !serviceCategory && activeTab !== 'services' && specialization ? specialization.replace(/_/g, ' ') : '',
      ].filter(Boolean).join(' ');
      if (qSearch) params.q = qSearch;
      if (serviceCategory) params.service_category = serviceCategory;
      if (serviceType) params.service_leaf_type = serviceType;
      if (department && department.toLowerCase() !== 'services' && department.toLowerCase() !== 'service') {
        params.department = department;
      }
      if (district) params.district = district;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }
      if (sortBy) params.sort_by = sortBy;

      // Combo packages ride along with services: same text, category and district filters.
      api
        .get('/public/service-packages', { params: { q: params.q, service_category: params.service_category, district: params.district } })
        .then((res) => setPackages(res.data.data ?? []))
        .catch(() => setPackages([]));

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
  }, [effectiveQ, district, specialization, serviceCategory, serviceType, department, userCoords, sortBy, activeTab, minPrice, maxPrice]);

  const activeFilterCount = [
    specialization, garmentType, subcategory, structure, serviceCategory, serviceType,
    minPrice || maxPrice, minRating, district,
  ].filter(Boolean).length;

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
    subcategory,
    setSubcategory,
    structure,
    setStructure,
    garmentType,
    setGarmentType,
    serviceCategory,
    setServiceCategory,
    serviceType,
    setServiceType,
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
    handleTabChange,
    stores,
    storesLoading,
    services,
    servicesLoading,
    servicesTotal,
    packages,
    items,
    total,
    lastPage,
    loading,
    filterPanelOpen,
    setFilterPanelOpen,
    activeFilterTab,
    setActiveFilterTab,
    draftSpecialization,
    setDraftSpecialization,
    draftDepartment,
    setDraftDepartment,
    draftSubcategory,
    setDraftSubcategory,
    draftStructure,
    setDraftStructure,
    draftGarmentType,
    setDraftGarmentType,
    draftServiceCategory,
    setDraftServiceCategory,
    draftServiceType,
    setDraftServiceType,
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
