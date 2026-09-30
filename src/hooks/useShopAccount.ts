'use client';

import { useAuthStore } from '@/store/useAuthStore';

export const SHOP_ROLES = ['store_owner', 'branch_manager', 'staff'];

/**
 * A shop account (owner, branch manager, or staff) signs in with an
 * admin-issued shop login and works from /dashboard — never the customer
 * side. An account that somehow also holds the customer role is treated as
 * a customer so it isn't locked out of shopping.
 */
export function useShopAccount() {
  const { user, store, hydrated, isAuthenticated } = useAuthStore();
  const roles = user?.roles?.map((r) => r.name) ?? [];
  const isShopAccount = hydrated && isAuthenticated
    && roles.some((r) => SHOP_ROLES.includes(r)) && !roles.includes('customer');
  const ownStoreKeys = store ? [store.slug, String(store.id)].filter(Boolean) : [];

  return { isShopAccount, ownStoreKeys };
}

/** True when a shop account is looking at its own Store Profile (`/store/{slug|id}`). */
export function useShopViewingOwnStore(storeKey: string | undefined): boolean {
  const { isShopAccount, ownStoreKeys } = useShopAccount();
  return isShopAccount && !!storeKey && ownStoreKeys.includes(storeKey);
}
