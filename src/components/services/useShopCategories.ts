'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { SHOWCASE_CATEGORIES } from '@/lib/serviceShowcase';
import type { ServiceCategory } from '@/lib/canonicalTaxonomy';

export interface ShopCategory { value: string; label: string }

// The search / job-order category each standard group maps onto. A shop's own
// service ("+ Add Service") has no standard group, so it searches as "others".
const SEARCH_CATEGORY: Record<string, ServiceCategory> = {
  custom_tailoring: 'custom_tailoring',
  formal: 'custom_tailoring',
  casual: 'custom_tailoring',
  alterations_repairs: 'alterations_repairs',
  uniform: 'uniform_production',
  office: 'uniform_production',
  school: 'uniform_production',
  medical: 'uniform_production',
  maritime: 'uniform_production',
  sports: 'printing_sublimation',
  embroidery: 'others',
};
export const searchCategoryFor = (category: string): ServiceCategory | '' =>
  category ? SEARCH_CATEGORY[category] ?? 'others' : '';

const cache = new Map<number, Promise<ShopCategory[]>>();

function load(storeId: number): Promise<ShopCategory[]> {
  if (!cache.has(storeId)) {
    const p = api.get(`/stores/${storeId}`).then((res) => {
      const s = res.data.data as { specializations?: string[] | null; custom_services?: string[] | null };
      const picked = new Set(s.specializations ?? []);
      return [
        ...SHOWCASE_CATEGORIES.filter((c) => picked.has(c.value)).map((c) => ({ value: c.value, label: c.label })),
        ...(s.custom_services ?? []).map((name) => ({ value: name, label: name })),
      ];
    });
    p.catch(() => cache.delete(storeId));
    cache.set(storeId, p);
  }
  return cache.get(storeId)!;
}

/** Forget the cached list (after the owner changes their shop's Services). */
export const refreshShopCategories = (storeId: number) => cache.delete(storeId);

/**
 * The categories a service can go under: only the services this shop lists on its
 * profile (the standard ones it ticked + its own). `current` keeps a service's
 * existing category selectable even if the shop no longer lists it.
 */
export function useShopCategories(storeId: number | undefined, current?: string | null) {
  const [list, setList] = useState<ShopCategory[] | null>(null);
  useEffect(() => {
    if (!storeId) return;
    let alive = true;
    load(storeId).then((l) => { if (alive) setList(l); }).catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, [storeId]);

  const options = list ?? [];
  if (current && !options.some((o) => o.value === current)) {
    const std = SHOWCASE_CATEGORIES.find((c) => c.value === current);
    return { options: [...options, { value: current, label: std?.label ?? current }], loading: list === null };
  }
  return { options, loading: list === null };
}
