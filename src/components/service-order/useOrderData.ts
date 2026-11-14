'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { CatalogListItem, PublicService, StoreProfile } from '@/components/store-storefront/types';

export interface SavedMeasurement {
  id: number;
  profile_name: string;
  version: number;
  superseded_at?: string | null;
  metrics?: Record<string, string | undefined>;
  store?: { slug: string } | null;
}

/** The customer's own terms for this service, worked out by the server (a trusted customer may owe no deposit). */
export interface CustomerTerms {
  payment_policy: 'none' | 'full' | 'deposit' | 'custom';
  payment_policy_percent: number;
  rush_available: boolean;
  /** percent = rush_fee_percent of the price; per_piece = rush_fee_per_piece pesos for every piece. */
  rush_fee_mode: 'percent' | 'per_piece';
  /** What rush adds for this customer (half for a repeat customer). */
  rush_fee_percent: number;
  rush_fee_per_piece: number;
}

export interface ShopPaymentMethod {
  id: number;
  kind: string;
  name: string;
}

export type OrderService = PublicService & { own_fabric_deduction?: string | number | null };

/** Everything the order page reads before the customer types anything. */
export function useOrderData(storeId: string, serviceId: string | null, signedIn: boolean) {
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [service, setService] = useState<OrderService | null>(null);
  const [designs, setDesigns] = useState<CatalogListItem[]>([]);
  const [saved, setSaved] = useState<SavedMeasurement[]>([]);
  const [terms, setTerms] = useState<CustomerTerms | null>(null);
  const [methods, setMethods] = useState<ShopPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get(`/public/stores/${storeId}`),
      api.get(`/public/stores/${storeId}/services`),
      api.get(`/catalog/${storeId}`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([storeRes, servicesRes, catalogRes]) => {
        setStore(storeRes.data.data);
        const found = (servicesRes.data.data ?? []).find((s: OrderService) => s.id === Number(serviceId)) ?? null;
        setService(found);
        // Only this service's own designs are offered as the style to follow.
        setDesigns(((catalogRes.data.data ?? []) as CatalogListItem[]).filter((d) => d.service_id === Number(serviceId)));
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [storeId, serviceId]);

  useEffect(() => {
    if (!signedIn || !serviceId) return;
    api.get(`/stores/${storeId}/service-order/payment-policy`, { params: { service_id: serviceId } })
      .then((res) => setTerms(res.data?.data ?? null))
      .catch(() => setTerms(null));
    api.get('/my-measurements')
      .then((res) => setSaved(((res.data.data ?? []) as SavedMeasurement[]).filter((m) => m.store?.slug === storeId && !m.superseded_at)))
      .catch(() => setSaved([]));
  }, [signedIn, storeId, serviceId]);

  useEffect(() => {
    api.get(`/public/stores/${storeId}/payment-methods`)
      .then((r) => setMethods(r.data?.data ?? []))
      .catch(() => setMethods([]));
  }, [storeId]);

  return { store, service, designs, saved, terms, methods, loading };
}
