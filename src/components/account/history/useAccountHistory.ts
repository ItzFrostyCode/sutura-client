'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { MyOrder } from '@/components/account/orders/ordersTypes';
import type { MyAppointment } from '@/components/account/appointments/appointmentTypes';
import type { MyMeasurement } from '@/components/account/measurements/measurementAccountTypes';

export interface ShopVisited {
  slug: string;
  name: string;
  logo_path: string | null;
}

/**
 * Customer History is a read-only frontend aggregate — no new backend
 * endpoint, no new table. Reuses the exact three endpoints /account/orders,
 * /account/appointments, and /account/measurements already call
 * individually, at the same per_page:100 convention every other account
 * list page in this codebase already uses. See docs/CUSTOMER-WORKFLOW.md §22.
 */
export function useAccountHistory() {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [measurements, setMeasurements] = useState<MyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No setLoading(true) here — the initial state above is already true,
    // and this effect only ever runs once (empty dep array), so re-setting
    // it would just be a synchronous setState-in-effect for no reason.
    Promise.allSettled([
      api.get('/my-orders', { params: { per_page: 100 } }),
      api.get('/my-appointments', { params: { per_page: 100 } }),
      api.get('/my-measurements'),
    ]).then(([ordersRes, apptRes, measRes]) => {
      setOrders(ordersRes.status === 'fulfilled' ? (ordersRes.value.data.data ?? []) : []);
      setAppointments(apptRes.status === 'fulfilled' ? (apptRes.value.data.data ?? []) : []);
      setMeasurements(measRes.status === 'fulfilled' ? (measRes.value.data.data ?? []) : []);
    }).finally(() => setLoading(false));
  }, []);

  const shops: ShopVisited[] = (() => {
    const map = new Map<string, ShopVisited>();
    for (const o of orders) {
      if (o.store?.slug && !map.has(o.store.slug)) {
        map.set(o.store.slug, { slug: o.store.slug, name: o.store.name, logo_path: o.store.logo_path });
      }
    }
    for (const a of appointments) {
      if (a.store?.slug && !map.has(a.store.slug)) {
        map.set(a.store.slug, { slug: a.store.slug, name: a.store.name, logo_path: a.store.logo_path });
      }
    }
    for (const m of measurements) {
      if (m.store?.slug && !map.has(m.store.slug)) {
        map.set(m.store.slug, { slug: m.store.slug, name: m.store.name, logo_path: m.store.logo_path });
      }
    }
    return Array.from(map.values());
  })();

  return { orders, appointments, measurements, shops, loading };
}
