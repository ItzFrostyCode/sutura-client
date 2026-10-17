'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { haversineKm } from '@/lib/customerLocation';
import { isStoreOpen } from '@/lib/storeStatus';
import type { ShopStatusFilter } from '@/components/home/homeFilters';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { RelatedStore, SearchServiceResult } from '../types';
import { garmentFilter } from './searchUrl';

type Params = Record<string, string | number>;

export interface SearchCriteria {
  q: string;
  /** A garment or garment-category slug from a link (see searchUrl.garmentFilter). */
  garmentType: string;
  /** One of the 4 services (SERVICE_GROUPS key) and one of its tasks (capability). */
  serviceCategory: string;
  serviceType: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  district: string;
  barangay: string;
  area: string;
  sortBy: string;
  radiusKm: number | null;
  openStatus: ShopStatusFilter;
  userCoords: { lat: number; lng: number } | null;
  page: number;
}

/** The place and price filters every list shares. */
function sharedParams(c: SearchCriteria, params: Params) {
  if (c.minPrice) params.min_price = c.minPrice;
  if (c.maxPrice) params.max_price = c.maxPrice;
  if (c.district) params.district = c.district;
  if (c.barangay) params.barangay = c.barangay;
  if (c.area) params.area = c.area;
}

function withWords(q: string, words?: string): string {
  return [q, words].filter(Boolean).join(' ');
}

/** Designs, shops and services for the current search, each from its own public endpoint. */
export function useSearchResults(c: SearchCriteria) {
  const { q, garmentType, serviceCategory, serviceType, minPrice, maxPrice, minRating, district, barangay, area, sortBy, radiusKm, openStatus, userCoords, page } = c;

  const [items, setItems] = useState<CatalogItemResult[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<RelatedStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [services, setServices] = useState<SearchServiceResult[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Designs
  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const { words, ...garment } = garmentFilter(garmentType);
      const params: Params = { per_page: 30, page, ...garment };
      const text = withWords(q, words);
      if (text) params.q = text;
      sharedParams(c, params);
      if (minRating) params.min_rating = minRating;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        if (radiusKm) params.radius_km = radiusKm;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, garmentType, minPrice, maxPrice, minRating, district, barangay, area, sortBy, page, userCoords, radiusKm]);

  // Shops
  useEffect(() => {
    setStoresLoading(true);
    const handle = setTimeout(() => {
      // Closed shops cannot be asked of the server, so that view takes a longer nearest-first list and picks them out.
      const params: Params = { per_page: openStatus === 'closed' ? 60 : 30 };
      if (q) params.q = q;
      sharedParams(c, params);
      const { garment_type, garment_category } = garmentFilter(garmentType);
      if (garment_category) params.garment_category = garment_category;
      // A garment or a service from a link narrows the shops to those that carry it.
      const carries = garment_type ?? serviceCategory;
      if (carries) params.specialization = carries;
      if (openStatus === 'open') params.open_now = 1;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        params.sort_by = 'distance';
        if (radiusKm) params.radius_km = radiusKm;
      }

      api
        .get('/public/stores', { params })
        .then((res) => {
          let list: RelatedStore[] = res.data.data ?? [];
          if (openStatus === 'closed') list = list.filter((s) => !isStoreOpen(s.operating_hours));
          if (userCoords) {
            list = list.map((store) => {
              if (store.distance_km != null) return store;
              let minKm: number | null = null;
              for (const b of store.branches ?? []) {
                if (!b.latitude || !b.longitude) continue;
                const d = haversineKm(userCoords.lat, userCoords.lng, Number(b.latitude), Number(b.longitude));
                if (minKm === null || d < minKm) minKm = d;
              }
              return { ...store, distance_km: minKm };
            });
            list.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
          }
          setStores(list);
        })
        .catch(() => setStores([]))
        .finally(() => setStoresLoading(false));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, district, barangay, area, garmentType, serviceCategory, userCoords, minPrice, maxPrice, radiusKm, openStatus]);

  // Services
  useEffect(() => {
    setServicesLoading(true);
    const handle = setTimeout(() => {
      const { words, garment_category } = garmentFilter(garmentType);
      const params: Params = { per_page: 30 };
      const text = withWords(q, words);
      if (text) params.q = text;
      sharedParams(c, params);
      if (garment_category) params.garment_category = garment_category;
      if (serviceCategory) params.service_category = serviceCategory;
      // service_type in the URL is a task the service ticked (a capability, e.g. zipper_replacement).
      if (serviceType) params.capability = serviceType;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }
      if (sortBy) params.sort_by = sortBy;

      api
        .get('/public/services', { params })
        .then((res) => setServices(res.data.data ?? []))
        .catch(() => setServices([]))
        .finally(() => setServicesLoading(false));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, district, barangay, area, garmentType, serviceCategory, serviceType, userCoords, sortBy, minPrice, maxPrice]);

  return { items, total, lastPage, loading, stores, storesLoading, services, servicesLoading };
}
