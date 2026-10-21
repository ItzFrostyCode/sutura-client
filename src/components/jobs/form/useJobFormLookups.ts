'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import type { CustomerData, CustomerMeasurement, ServiceData, ServiceField } from './types';

function toField(raw: unknown): ServiceField {
  const f = raw as Record<string, unknown>;
  const type = String(f.type || 'text');
  const resolved = type === 'dropdown' ? 'select' : type === 'short_text' ? 'text' : type;
  return {
    id: String(f.id || f.name || Math.random().toString(36).substring(2, 11)),
    label: String(f.label || ''),
    type: resolved as ServiceField['type'],
    required: Boolean(f.required),
    options: Array.isArray(f.options) ? f.options.map(String) : [],
  };
}

function toService(raw: unknown): ServiceData {
  const s = raw as Record<string, unknown>;
  return {
    ...s,
    id: Number(s.id),
    name: String(s.name || ''),
    category: typeof s.category === 'string' ? s.category : undefined,
    base_price: s.base_price !== null && s.base_price !== undefined ? String(s.base_price) : undefined,
    custom_fields: (Array.isArray(s.custom_fields) ? s.custom_fields : []).map(toField),
    tags: Array.isArray(s.tags) ? s.tags : [],
  } as ServiceData;
}

const list = (res: { data?: { data?: unknown } }): unknown[] => (Array.isArray(res.data?.data) ? res.data.data : []);

/** The shop's customers, services and designs the form picks from. */
export function useJobFormLookups() {
  const { store, user } = useAuthStore();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!store) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    Promise.all([
      api.get(`/stores/${store.id}/customers`, { params: { all: 1 } }), // also people who have only booked or visited so far
      api.get(`/stores/${store.id}/services`),
      // Designs are owner/manager-only to read; staff opening a job from an appointment just go without them.
      api.get(`/stores/${store.id}/catalog`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([c, s, d]) => {
        setCustomers(list(c) as CustomerData[]);
        setServices(list(s).map(toService));
        setCatalogItems(list(d) as CatalogItem[]);
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, [store, user]);

  /** Registers a first-time customer without leaving the form; they are added to the list straight away. */
  const addCustomer = async (payload: Record<string, string | null>): Promise<CustomerData> => {
    if (!store) throw new Error('No store selected.');
    const res = await api.post(`/stores/${store.id}/customers`, payload);
    const created = res.data.data as CustomerData;
    setCustomers((prev) => [...prev, created]);
    return created;
  };

  return { store, customers, services, catalogItems, loading, error, addCustomer };
}

/** A customer's current (not superseded) measurement profiles, newest first. */
export function useCustomerMeasurements(storeId: number | undefined, customerId: string) {
  const [measurements, setMeasurements] = useState<CustomerMeasurement[]>([]);

  useEffect(() => {
    if (!storeId || !customerId) {
      const reset = setTimeout(() => setMeasurements([]), 0);
      return () => clearTimeout(reset);
    }
    let live = true;
    api
      .get(`/stores/${storeId}/measurements?customer_id=${customerId}`)
      .then((res) => {
        if (!live) return;
        const current = (list(res) as CustomerMeasurement[]).filter((m) => !m.superseded_at);
        setMeasurements(current.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
      })
      .catch(() => live && setMeasurements([]));
    return () => {
      live = false;
    };
  }, [storeId, customerId]);

  return measurements;
}
