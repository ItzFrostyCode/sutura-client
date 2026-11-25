'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export interface ShopReadOnlyState {
  /** No running plan: the server refuses every change in the shop (CheckRole). */
  readOnly: boolean;
  /** The shop's latest subscription row (for the trial-ended case). */
  sub: { status?: string; trial_ends_at?: string | null } | null;
}

// One request per shop per page load, shared by the banner and the Orders board.
const cache = new Map<number, Promise<ShopReadOnlyState>>();

function load(storeId: number): Promise<ShopReadOnlyState> {
  let p = cache.get(storeId);
  if (!p) {
    p = api.get(`/stores/${storeId}/subscription`)
      .then((res) => ({ readOnly: Boolean(res.data.read_only), sub: res.data.data ?? null }))
      .catch(() => {
        cache.delete(storeId);
        // A hint only; the server still enforces read-only.
        return { readOnly: false, sub: null };
      });
    cache.set(storeId, p);
  }
  return p;
}

/** Forget the cached answer (after a plan payment or switch), so the next read refetches. */
export function clearShopReadOnly(storeId?: number) {
  if (storeId === undefined) cache.clear();
  else cache.delete(storeId);
}

/** Whether this shop is read-only because its plan has ended. False until known. */
export function useShopReadOnly(storeId: number | undefined): ShopReadOnlyState {
  const [state, setState] = useState<ShopReadOnlyState>({ readOnly: false, sub: null });
  useEffect(() => {
    if (!storeId) return;
    let alive = true;
    load(storeId).then((s) => { if (alive) setState(s); });
    return () => { alive = false; };
  }, [storeId]);
  return state;
}

/** The text shown on hover over any action a read-only shop can't take. */
export const READ_ONLY_HINT = 'Read-only: this shop’s plan has ended';

/** Read-only state of the shop the signed-in account works in. */
export function useCurrentShopReadOnly(): boolean {
  const storeId = useAuthStore((s) => s.store?.id);
  return useShopReadOnly(storeId).readOnly;
}
