'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getSavedLocation,
  saveLocation,
  getOldLocation,
  swapLocations,
  requestCurrentLocation,
  LOCATION_CHANGED_EVENT,
  type SavedLocation,
} from '@/lib/customerLocation';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { useCloseOnDesktop } from '@/hooks/useCloseOnDesktop';
import { useToast } from '@/context/ToastContext';
import { parseRadiusKm, parseStatusFilter, type AllFilters } from '@/components/home/homeFilters';
import type { FilterTabKey, SearchActiveTab } from '../types';
import { categoryText, garmentParam, resolveTab, CONTEXT_PARAMS } from './searchUrl';
import { useSearchResults } from './useSearchResults';

export function useSearchData() {
  const router = useRouter();
  const gate = useGuestGatedHref();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [q, setQ] = useState(searchParams.get('q') ?? searchParams.get('search') ?? '');
  const effectiveQ = q.trim();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [categoryLabel, setCategoryLabel] = useState(() => categoryText(searchParams));

  const [specialization, setSpecialization] = useState(
    () => searchParams.get('specialization') ?? searchParams.get('category') ?? ''
  );
  const [department, setDepartment] = useState(() => searchParams.get('department') ?? '');
  const [subcategory, setSubcategory] = useState(() => searchParams.get('subcategory') ?? '');
  const [structure, setStructure] = useState(() => searchParams.get('structure') ?? '');
  const [garmentType, setGarmentType] = useState(() => garmentParam(searchParams));
  const [serviceCategory, setServiceCategory] = useState(() => searchParams.get('service_category') ?? '');
  const [serviceType, setServiceType] = useState(() => searchParams.get('service_type') ?? '');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(() => searchParams.get('minRating') ?? '');
  const [district, setDistrict] = useState(() => searchParams.get('district') ?? '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') ?? '');
  const [page, setPage] = useState(1);

  const radiusKm = parseRadiusKm(searchParams.get('radius_km'));
  const barangay = searchParams.get('barangay') ?? '';
  const area = searchParams.get('area') ?? '';
  const openStatus = parseStatusFilter(searchParams.get('open'));

  const [activeTab, setActiveTab] = useState<SearchActiveTab>(() => resolveTab(searchParams));

  // Sync state when URL search params change
  useEffect(() => {
    const nextQ = searchParams.get('q') ?? searchParams.get('search') ?? '';
    setQ(nextQ);
    setCategoryLabel(categoryText(searchParams));
    setSpecialization(searchParams.get('specialization') ?? searchParams.get('category') ?? '');
    setDepartment(searchParams.get('department') ?? '');
    setSubcategory(searchParams.get('subcategory') ?? '');
    setStructure(searchParams.get('structure') ?? '');
    setGarmentType(garmentParam(searchParams));
    setServiceCategory(searchParams.get('service_category') ?? '');
    setServiceType(searchParams.get('service_type') ?? '');
    setDistrict(searchParams.get('district') ?? '');
    setActiveTab(resolveTab(searchParams));
  }, [searchParams]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Location state
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [oldLocation, setOldLocation] = useState<SavedLocation | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const loc = getSavedLocation();
    setSavedLocation(loc);
    setOldLocation(getOldLocation());
    if (loc?.lat && loc?.lng) {
      setUserCoords({ lat: loc.lat, lng: loc.lng });
    }
  }, []);

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

  function handleToggleOldLocation() {
    const result = swapLocations();
    if (result?.current) {
      setSavedLocation(result.current);
      setUserCoords({ lat: result.current.lat, lng: result.current.lng });
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
        toast.success(`Showing stores nearest to ${loc.address || 'you'}.`);
      },
      () => {
        setLocating(false);
        toast.error('Unable to retrieve location. Please check browser permissions.');
      }
    );
  }

  function handleTabChange(nextTab: SearchActiveTab) {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab === 'showroom' ? 'catalog' : nextTab);
    const trimmed = q.trim();
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    setPage(1);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  // Filter Drawer draft states
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
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
  }, [effectiveQ, specialization, garmentType, minPrice, maxPrice, minRating, district, barangay, area, sortBy, radiusKm, openStatus]);

  // Use the extracted results hook
  const { items, total, lastPage, loading, stores, storesLoading, services, servicesLoading } = useSearchResults({
    q: effectiveQ,
    garmentType: garmentType || specialization,
    serviceCategory,
    serviceType,
    minPrice,
    maxPrice,
    minRating,
    district,
    barangay,
    area,
    sortBy,
    radiusKm,
    openStatus,
    userCoords,
    page,
  });

  function applyAllFilters(next: AllFilters) {
    setMinPrice(next.minPrice);
    setMaxPrice(next.maxPrice);
    setMinRating(next.minRating);
    setDistrict(next.district);
    setSortBy(next.sortBy);
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = q.trim();
    const entries: [string, string][] = [
      ['q', trimmed],
      ['radius_km', next.radiusKm !== null ? String(next.radiusKm) : ''],
      ['open', next.status !== 'all' ? next.status : ''],
      ['minPrice', next.minPrice],
      ['maxPrice', next.maxPrice],
      ['minRating', next.minRating],
      ['district', next.district],
      ['barangay', next.district ? next.barangay : ''],
      ['area', next.district ? next.area : ''],
      ['sortBy', next.sortBy],
    ];
    for (const [key, value] of entries) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    setPage(1);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  function clearContext() {
    const params = new URLSearchParams(searchParams.toString());
    CONTEXT_PARAMS.forEach((k) => params.delete(k));
    const trimmed = q.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    setPage(1);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  const activeFilterCount = [
    specialization, garmentType, subcategory, structure, serviceCategory, serviceType,
    minPrice || maxPrice, minRating, district || barangay || area,
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
    barangay,
    area,
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
    servicesTotal: services.length,
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
    radiusKm,
    openStatus,
    applyAllFilters,
    clearContext,
  };
}
