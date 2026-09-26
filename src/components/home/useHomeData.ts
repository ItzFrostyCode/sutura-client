'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getSavedLocation, requestCurrentLocation } from '@/lib/customerLocation';
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

  useEffect(() => {
    // Default sort already orders by is_featured then rating/created_at —
    // the first result doubles as an honest "featured store" pick, no
    // separate curation flag needed.
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
