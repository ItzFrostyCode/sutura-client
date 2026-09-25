import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { type StoreResult } from './storesTypes';

export function useStoreDirectory() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [sortBy, setSortBy] = useState('name_asc');
  const [district, setDistrict] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [page, setPage] = useState(1);

  const [stores, setStores] = useState<StoreResult[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  function handleNearMe() {
    if (userLocation) {
      setUserLocation(null);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location. Check your browser’s location permission and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    setPage(1);
  }, [q, sortBy, district, specialization, openNow, userLocation]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string | number> = { per_page: 24, page, sort_by: sortBy };
      if (q.trim()) params.q = q.trim();
      if (district) params.district = district;
      if (specialization) params.specialization = specialization;
      if (openNow) params.open_now = 1;
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.sort_by = 'distance';
      }

      api.get('/public/stores', { params })
        .then((res) => {
          setStores(res.data.data ?? []);
          setTotal(res.data.meta?.total ?? 0);
          setLastPage(res.data.meta?.last_page ?? 1);
        })
        .catch(() => {
          setStores([]);
          setTotal(0);
          setLastPage(1);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [q, sortBy, district, specialization, openNow, userLocation, page]);

  return {
    q,
    setQ,
    sortBy,
    setSortBy,
    district,
    setDistrict,
    specialization,
    setSpecialization,
    openNow,
    setOpenNow,
    page,
    setPage,
    stores,
    total,
    lastPage,
    loading,
    userLocation,
    locating,
    locationError,
    setLocationError,
    handleNearMe,
    filterOpen,
    setFilterOpen,
  };
}
