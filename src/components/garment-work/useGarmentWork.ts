'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { GARMENT_WORK_COPY, NO_DAMAGE, kindOf } from './garmentWorkCopy';

export interface WorkLine { id: number; label: string; amount: string | number }
export interface WorkService {
  id: number; name: string; service_types?: string[]; service_category?: string | null; price_display?: string | null; pricing?: WorkLine[];
}
export interface WorkPlaced { id: number; order_number: string; tracking_code: string }

/** The garment-work request (repair, alteration or embroidery on the customer's own clothes): load, form state, submit. */
export function useGarmentWork(storeId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const serviceId = params.get('service_id');
  const { user, hydrated } = useAuthStore();

  const [service, setService] = useState<WorkService | null>(null);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [condition, setCondition] = useState('');
  const [noDamage, setNoDamage] = useState(false);
  const [detail, setDetail] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<WorkPlaced | null>(null);

  // Sending a request needs an account (the shop has to know who it is for).
  useEffect(() => {
    if (!hydrated || user) return;
    const q = params.toString();
    router.replace(`/login?redirect=${encodeURIComponent(`${pathname}${q ? `?${q}` : ''}`)}`);
  }, [hydrated, user, router, pathname, params]);

  useEffect(() => {
    if (!serviceId) { setLoading(false); return; }
    Promise.all([api.get(`/public/stores/${storeId}/services`), api.get(`/public/stores/${storeId}`).catch(() => null)])
      .then(([svc, store]) => {
        const match = (svc.data.data ?? []).find((s: WorkService) => String(s.id) === serviceId);
        setService(match && (match.service_types ?? []).includes('alteration_repair') ? match : null);
        setStoreName(store?.data?.data?.name ?? '');
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [storeId, serviceId]);

  const kind = kindOf(service?.service_category);
  const copy = GARMENT_WORK_COPY[kind];
  const lines = useMemo(() => (service?.pricing ?? []).filter((p) => picked.includes(p.id)), [service, picked]);
  const subtotal = lines.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const startingPrice = service?.price_display === 'starting';
  // "Quotation required": the shop prices it after seeing the garment, so no amounts are shown.
  const quoted = service?.price_display === 'quotation';

  const problem = !item.trim() ? `Answer "${copy.itemLabel}"`
    : picked.length === 0 ? `Pick at least one under "${copy.workLabel}"`
      : !noDamage && !condition.trim() ? 'Describe how the garment is now, or tick "No damage"'
        : copy.detailRequired && !detail.trim() ? `Answer "${copy.detailLabel}"` : '';

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async () => {
    if (problem || !service || busy) { setError(problem); return; }
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/stores/${storeId}/repair-requests`, {
        service_id: service.id,
        garment_description: item.trim(),
        pre_existing_damage_notes: noDamage ? NO_DAMAGE : condition.trim(),
        local_adjustment: detail.trim() || undefined,
        pricing_ids: picked,
        reference_images: photos,
      });
      setPlaced(res.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "The request didn't go through. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return {
    storeId, router, loading: loading || !hydrated || !user, service, storeName, kind, copy,
    item, setItem, picked, toggle, condition, setCondition, noDamage, setNoDamage, detail, setDetail, photos, setPhotos,
    lines, subtotal, startingPrice, quoted, problem, busy, error, submit, placed,
  };
}

export type GarmentWorkState = ReturnType<typeof useGarmentWork>;
