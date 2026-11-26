import { useEffect } from 'react';
import { create } from 'zustand';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { clearShopReadOnly } from '@/hooks/useShopReadOnly';

export type SubscriptionTier = 'basic' | 'pro' | 'premium';

/**
 * Feature keys and which minimum tier unlocks them:
 *
 * BASIC:   customer_management | appointments | order_tracking | measurements | staff (up to max_staff)
 * PRO:     portfolio | analytics | notifications | inquiry | boosted_visibility | reports (sales & staff)
 * PREMIUM: featured_visibility | custom_branding | advanced_dashboard (branch comparison)
 */
export type GatedFeature =
  | 'catalog'
  | 'portfolio'
  | 'staff'
  | 'analytics'
  | 'notifications'
  | 'inquiry'
  | 'boosted_visibility'
  | 'reports'
  | 'featured_visibility'
  | 'custom_branding'
  | 'advanced_dashboard'
  | 'multi_branch';

export const PRO_FEATURES = new Set<GatedFeature>([
  'catalog',
  'portfolio',
  'analytics',
  'notifications',
  'inquiry',
  'boosted_visibility',
  // The Reports page (sales & staff) — AnalyticsController::staffProductivity requires 'pro'.
  'reports',
]);

export const PREMIUM_FEATURES = new Set<GatedFeature>([
  'featured_visibility',
  'custom_branding',
  'advanced_dashboard',
  'multi_branch',
]);

export function requiredPlanLabel(feature: GatedFeature): 'Pro' | 'Premium' {
  return PREMIUM_FEATURES.has(feature) ? 'Premium' : 'Pro';
}

function tierFromSlug(planSlug: string): SubscriptionTier {
  const slug = planSlug.toLowerCase();
  if (slug.includes('premium')) return 'premium';
  if (slug.includes('pro')) return 'pro';
  return 'basic';
}

/**
 * Shared (not per-component) subscription tier state — the Billing page and
 * the dashboard header's "Plan Activated" badge each call useSubscriptionTier()
 * independently. Previously each held its own local state, so switching plans
 * on the Billing page updated that page but left the header badge stuck on
 * the stale tier until a full reload. A shared Zustand store means both read
 * the same value, and refreshTier() (called right after a successful
 * subscribe) updates it everywhere at once.
 */
interface SubscriptionStore {
  tier: SubscriptionTier;
  /** The plan's branch limit from the admin Plans page (-1 = unlimited, 0 = main shop only). */
  maxBranches: number;
  /** The plan's staff limit (-1 = unlimited) and current usage across the store. */
  maxStaff: number;
  staffUsage: { used: number; max: number } | null;
  /** The plan's service limit (-1 = unlimited). */
  maxServices: number;
  loading: boolean;
  lastStoreId: number | null;
  setTier: (tier: SubscriptionTier) => void;
  fetchTier: (storeId: number) => Promise<void>;
}

const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  // Default to 'premium' so no features are prematurely gated during load
  tier: 'premium',
  maxBranches: -1,
  maxStaff: -1,
  staffUsage: null,
  maxServices: -1,
  loading: true,
  lastStoreId: null,
  setTier: (tier) => set({ tier }),
  fetchTier: async (storeId: number) => {
    set({ loading: true, lastStoreId: storeId });
    try {
      const res = await api.get(`/stores/${storeId}/subscription`);
      const sub = res.data.data;
      const staffUsage = res.data?.staff_usage ?? null;
      const running = Boolean(
        sub &&
        ['active', 'trial'].includes(sub.status) &&
        (!sub.ends_at || new Date(sub.ends_at).getTime() >= Date.now())
      );
      const planSlug: string = running ? (sub?.plan?.slug || sub?.plan?.name || '') : '';
      // No running subscription — treat as Basic (matches server PlanGate::tier).
      const tier = planSlug ? tierFromSlug(planSlug) : 'basic';
      const rawMax = running ? sub?.plan?.max_branches : 0;
      const rawStaff = running ? sub?.plan?.max_staff : staffUsage?.max ?? 2;
      const rawServices = running ? sub?.plan?.max_services : 10;
      // Branch Shops beyond the Main Shop (-1 unlimited, 0 main shop only).
      const maxBranches = rawMax === null || rawMax === undefined ? (tier === 'premium' ? -1 : 0) : Number(rawMax);
      const maxStaff = rawStaff === null || rawStaff === undefined ? -1 : Number(rawStaff);
      const maxServices = rawServices === null || rawServices === undefined ? -1 : Number(rawServices);
      set({ tier, maxBranches, maxStaff, staffUsage, maxServices, loading: false });
    } catch {
      // On API error, default to premium to avoid accidental lockout during dev
      set({ tier: 'premium', maxBranches: -1, maxStaff: -1, staffUsage: null, maxServices: -1, loading: false });
    }
  },
}));

/** Call after a successful plan switch so every consumer updates immediately. */
export function refreshSubscriptionTier(storeId: number) {
  // A plan change can end read-only mode (or start it); re-ask next time.
  clearShopReadOnly(storeId);
  return useSubscriptionStore.getState().fetchTier(storeId);
}

export interface UseSubscriptionTierReturn {
  tier: SubscriptionTier;
  maxBranches: number;
  maxStaff: number;
  staffUsage: { used: number; max: number } | null;
  maxServices: number;
  loading: boolean;
  isGated: (feature: GatedFeature) => boolean;
}

export function useSubscriptionTier(): UseSubscriptionTierReturn {
  const { store, user } = useAuthStore();
  const { tier, maxBranches, maxStaff, staffUsage, maxServices, loading, lastStoreId, fetchTier } = useSubscriptionStore();
  // Any store member (owner, branch manager, staff) can read GET /stores/{store}/subscription,
  // so branch managers share the same tier gating as the owner instead of falling back to 'premium'.
  const hasStoreAccess = Boolean(
    user?.roles?.some((r) => ['store_owner', 'branch_manager', 'staff'].includes(r.name))
  );

  useEffect(() => {
    if (!store?.id || !hasStoreAccess) {
      useSubscriptionStore.setState({ loading: false });
      return;
    }
    // Only (re)fetch when the store actually changes — the store already
    // holds the current value for repeat mounts (e.g. navigating pages).
    if (lastStoreId !== store.id) {
      fetchTier(store.id);
    }
  }, [store?.id, hasStoreAccess, lastStoreId, fetchTier]);

  /**
   * Returns true if the feature is locked for the current tier.
   *
   * Tier hierarchy:
   *   basic  — cannot use PRO or PREMIUM features
   *   pro    — can use PRO features, cannot use PREMIUM features
   *   premium — full access to everything
   */
  const isGated = (feature: GatedFeature): boolean => {
    if (loading) return false;
    if (feature === 'multi_branch') {
      return maxBranches === 0;
    }
    if (tier === 'premium') return false;

    if (tier === 'pro') {
      // Pro users are gated only from premium-only features
      return PREMIUM_FEATURES.has(feature);
    }

    if (tier === 'basic') {
      // Basic users are gated from everything PRO and PREMIUM
      return PRO_FEATURES.has(feature) || PREMIUM_FEATURES.has(feature);
    }

    return false;
  };

  return { tier, maxBranches, maxStaff, staffUsage, maxServices, loading, isGated };
}
