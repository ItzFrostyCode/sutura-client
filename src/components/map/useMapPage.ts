'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Map as LeafletMap } from 'leaflet';
import api from '@/lib/axios';
import { getSavedLocation, saveLocationWithHistory, type SavedLocation } from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery } from '@/lib/parseLocationInput';
import { isStoreOpen } from '@/lib/storeStatus';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import { DAVAO_CENTER, type StoreApiResult } from './mapTypes';

export function useMapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<LeafletMap | null>(null);

  const isSelectMode =
    searchParams.get('select') === '1' ||
    searchParams.get('mode') === 'select' ||
    searchParams.get('mode') === 'map';
  const returnTo = searchParams.get('returnTo') || null;
  const continueTo = searchParams.get('continueTo') || null;

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    if (returnTo) {
      router.replace(returnTo);
    } else {
      router.replace('/');
    }
  }

  const [selectedBranch, setSelectedBranch] = useState<DiscoveryMapBranch | null>(null);
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [branches, setBranches] = useState<DiscoveryMapBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [pickerCoords, setPickerCoords] = useState<[number, number]>(DAVAO_CENTER);
  const [pickedAddress, setPickedAddress] = useState<string>('');
  const [pickedDistrict, setPickedDistrict] = useState<string>('');
  const [reverseLoading, setReverseLoading] = useState(false);
  const geocodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = getSavedLocation();
    if (saved?.lat && saved?.lng) {
      setUserLocation({ lat: saved.lat, lng: saved.lng });
      setPickerCoords([saved.lat, saved.lng]);
      setPickedAddress(saved.address || '');
      setPickedDistrict(saved.district || '');
    }
  }, []);

  useEffect(() => {
    const incomingQ = searchParams.get('q');
    if (incomingQ !== null) setQ(incomingQ);
    const incomingDistrict = searchParams.get('district');
    if (incomingDistrict !== null) setDistrict(incomingDistrict);
  }, [searchParams]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setShowFilterDropdown(false);
      }
      mapRef.current?.invalidateSize();
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectBranch = useCallback((branch: DiscoveryMapBranch | null) => {
    setSelectedBranch(branch);
    if (branch && mapRef.current) {
      mapRef.current.setView([branch.latitude, branch.longitude], 15, { animate: true });
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    setDistrict('');
    setStatusFilter('all');
    setUserLocation(null);
  }, []);

  const handleMapMoveEnd = useCallback(
    (lat: number, lng: number) => {
      if (!isSelectMode) return;

      setPickerCoords((prev) => {
        if (prev && Math.abs(prev[0] - lat) < 0.0001 && Math.abs(prev[1] - lng) < 0.0001) {
          return prev;
        }
        return [lat, lng];
      });

      if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
      geocodeTimeout.current = setTimeout(async () => {
        setReverseLoading(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          setPickedAddress(data?.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          const d =
            data?.address?.suburb ||
            data?.address?.neighbourhood ||
            data?.address?.city_district ||
            '';
          if (d) setPickedDistrict(d);
        } catch {
          setPickedAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setReverseLoading(false);
        }
      }, 350);
    },
    [isSelectMode]
  );

  async function handleSearchSubmit() {
    const text = q.trim();
    if (!text) return;

    const parsed = parseCoordsFromMapsLink(text);
    if (parsed) {
      mapRef.current?.setView([parsed.lat, parsed.lng], 16);
      handleMapMoveEnd(parsed.lat, parsed.lng);
      return;
    }

    try {
      const cleaned = cleanLocationQuery(text);
      const queryText = cleaned.toLowerCase().includes('davao')
        ? cleaned
        : `${cleaned}, Davao City`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          queryText
        )}&viewbox=125.30,7.40,125.80,6.85&bounded=1&limit=3&countrycodes=ph`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current?.setView([lat, lng], 16);
        handleMapMoveEnd(lat, lng);
        setPickedAddress(data[0].display_name);
      }
    } catch {
      // Keep store filter query
    }
  }

  function handleNearMe() {
    if (userLocation && !isSelectMode) {
      setUserLocation(null);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        mapRef.current?.setView([latitude, longitude], 15);
        handleMapMoveEnd(latitude, longitude);
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location. Check browser location permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleConfirmPickedLocation(customLoc?: SavedLocation) {
    const loc: SavedLocation = customLoc || {
      lat: pickerCoords[0],
      lng: pickerCoords[1],
      address: pickedAddress || `${pickerCoords[0].toFixed(4)}, ${pickerCoords[1].toFixed(4)}`,
      district: pickedDistrict || district || 'Davao City',
    };
    saveLocationWithHistory(loc);

    const dest = continueTo || (returnTo && returnTo !== '/' ? returnTo : '/search');
    const query = q.trim();
    if (query && !dest.includes('q=')) {
      const sep = dest.includes('?') ? '&' : '?';
      router.push(`${dest}${sep}q=${encodeURIComponent(query)}`);
    } else {
      router.push(dest);
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string> = { per_page: '50' };
      if (q.trim()) params.q = q.trim();
      if (district && district !== 'all') params.district = district;
      if (userLocation) {
        params.lat = String(userLocation.lat);
        params.lng = String(userLocation.lng);
        params.sort_by = 'distance';
      }

      api
        .get('/public/stores', { params })
        .then((res) => {
          const stores: StoreApiResult[] = res.data.data ?? [];
          const pins: DiscoveryMapBranch[] = stores.flatMap((store) => {
            const open = isStoreOpen(store.operating_hours);
            return (store.branches ?? [])
              .filter(
                (b) =>
                  b.latitude != null &&
                  b.longitude != null &&
                  !Number.isNaN(Number(b.latitude)) &&
                  !Number.isNaN(Number(b.longitude))
              )
              .map((b) => ({
                storeSlug: store.slug,
                storeName: store.name,
                storeLogoPath: store.logo_path,
                branchId: b.id,
                branchName: b.name,
                isMain: !!b.is_main,
                address: b.address,
                city: b.city,
                district: (b as { district?: string | null }).district || null,
                landmark: b.landmark,
                latitude: Number(b.latitude),
                longitude: Number(b.longitude),
                isOpen: open,
              }));
          });
          setBranches(pins);
        })
        .catch(() => setBranches([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [q, district, userLocation]);

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (statusFilter === 'online' && !b.isOpen) return false;
      if (statusFilter === 'offline' && b.isOpen) return false;
      return true;
    });
  }, [branches, statusFilter]);

  const hasActiveFilters = Boolean((district && district !== 'all') || statusFilter !== 'all' || userLocation);

  return {
    isSelectMode,
    mapRef,
    handleBack,
    q,
    setQ,
    district,
    setDistrict,
    statusFilter,
    setStatusFilter,
    showFilterDropdown,
    setShowFilterDropdown,
    branches,
    filteredBranches,
    hasActiveFilters,
    loading,
    selectedBranch,
    setSelectedBranch,
    userLocation,
    setUserLocation,
    locating,
    locationError,
    setLocationError,
    pickerCoords,
    pickedAddress,
    reverseLoading,
    handleMapMoveEnd,
    handleSearchSubmit,
    handleNearMe,
    handleSelectBranch,
    handleResetFilters,
    handleConfirmPickedLocation,
  };
}
