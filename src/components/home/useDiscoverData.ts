'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { isStoreOpen } from '@/lib/storeStatus';
import type { SearchServiceResult } from '@/components/search/types';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { StoreResult } from './homeTypes';
import type { NearFilters } from './homeFilters';

const NEAR_LIMIT = 6;

/** Data for the Discover sections. Near Shops follows the visitor's location and filters; the others do not. */
export function useDiscoverData(coords: { lat: number; lng: number } | null, filters: NearFilters) {
  const [featured, setFeatured] = useState<StoreResult[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [trending, setTrending] = useState<CatalogItemResult[]>([]);
  const [services, setServices] = useState<SearchServiceResult[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [near, setNear] = useState<StoreResult[]>([]);
  const [nearLoading, setNearLoading] = useState(false);

  useEffect(() => {
    // No lat/lng on purpose: without a location the server lists plan-featured shops first, so the
    // featured ones are at the front and the flag tells us which they are.
    api.get('/public/stores', { params: { per_page: 20 } })
      .then((res) => setFeatured(((res.data.data ?? []) as StoreResult[]).filter((s) => s.is_featured).slice(0, 8)))
      .catch(() => setFeatured([]))
      .finally(() => setFeaturedLoading(false));
    // Real best-seller signal (order count), only used to fill the spotlight's thumbnails.
    api.get('/public/catalog-items', { params: { per_page: 8, sort_by: 'top_sales' } })
      .then((res) => setTrending(res.data.data ?? []))
      .catch(() => setTrending([]));
    api.get('/public/services', { params: { per_page: 8 } })
      .then((res) => setServices(res.data.data ?? []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  const lat = coords?.lat;
  const lng = coords?.lng;
  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setNear([]);
      setNearLoading(false);
      return;
    }
    let cancelled = false;
    setNearLoading(true);
    const params: Record<string, string | number> = { lat, lng, sort_by: 'distance', per_page: filters.status === 'closed' ? 30 : NEAR_LIMIT };
    if (filters.radiusKm !== null) params.radius_km = filters.radiusKm;
    // The server can only ask "open now"; closed shops are picked out of a longer, nearest-first list.
    if (filters.status === 'open') params.open_now = 1;
    api.get('/public/stores', { params })
      .then((res) => {
        if (cancelled) return;
        let rows = (res.data.data ?? []) as StoreResult[];
        if (filters.status === 'closed') rows = rows.filter((s) => !isStoreOpen(s.operating_hours));
        setNear(rows.slice(0, NEAR_LIMIT));
      })
      .catch(() => { if (!cancelled) setNear([]); })
      .finally(() => { if (!cancelled) setNearLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lng, filters.radiusKm, filters.status]);

  return { featured, featuredLoading, trending, services, servicesLoading, near, nearLoading };
}
