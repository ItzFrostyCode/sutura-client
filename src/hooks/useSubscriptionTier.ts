import { useEffect } from 'react';
import { create } from 'zustand';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

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
  | 'advanced_dashboard';

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
  /** The plan's branch limit from the admin Plans page (-1 = unlimited). */
  maxBranches: number;
  loading: boolean;
  lastStoreId: number | null;
  setTier: (tier: SubscriptionTier) => void;
  fetchTier: (storeId: number) => Promise<void>;
}

const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  // Default to 'premium' so no features are prematurely gated during load
  tier: 'premium',
  maxBranches: -1,
  loading: true,
  lastStoreId: null,
  setTier: (tier) => set({ tier }),
  fetchTier: async (storeId: number) => {
    set({ loading: true, lastStoreId: storeId });
    try {
      const res = await api.get(`/stores/${storeId}/subscription`);
      const sub = res.data.data;
      const planSlug: string = sub?.plan?.slug || sub?.plan?.name || '';
      // No active subscription — treat as Basic
      const tier = planSlug ? tierFromSlug(planSlug) : 'basic';
      const rawMax = sub?.plan?.max_branches;
      const maxBranches = rawMax === null || rawMax === undefined ? (tier === 'premium' ? -1 : 1) : Number(rawMax);
      set({ tier, maxBranches, loading: false });
    } catch {
      // On API error, default to premium to avoid accidental lockout during dev
      set({ tier: 'premium', maxBranches: -1, loading: false });
    }
  },
}));

/** Call after a successful plan switch so every consumer updates immediately. */
export function refreshSubscriptionTier(storeId: number) {
  return useSubscriptionStore.getState().fetchTier(storeId);
}

export interface UseSubscriptionTierReturn {
  tier: SubscriptionTier;
  maxBranches: number;
  loading: boolean;
  isGated: (feature: GatedFeature) => boolean;
}

export function useSubscriptionTier(): UseSubscriptionTierReturn {
  const { store, user } = useAuthStore();
  const { tier, maxBranches, loading, lastStoreId, fetchTier } = useSubscriptionStore();
  // Billing is an owner-only concern (matches the store_owner-only
  // /stores/{store}/subscription route) — staff/branch managers share this
  // dashboard now, and shouldn't 403 fetching a plan they don't manage.
  const isStoreOwner = user?.roles?.[0]?.name === 'store_owner';

  useEffect(() => {
    if (!store?.id || !isStoreOwner) {
      useSubscriptionStore.setState({ loading: false });
      return;
    }
    // Only (re)fetch when the store actually changes — the store already
    // holds the current value for repeat mounts (e.g. navigating pages).
    if (lastStoreId !== store.id) {
      fetchTier(store.id);
    }
  }, [store?.id, isStoreOwner, lastStoreId, fetchTier]);

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
    if (tier === 'premium') return false;

    // Features that require at least PRO. 'staff' isn't here: every plan can
    // add staff up to its own max_staff (Basic 2), which StaffController::store
    // enforces with an upgrade message once the cap is reached.
    const proFeatures = new Set<GatedFeature>([
      'catalog',
      'portfolio',
      'analytics',
      'notifications',
      'inquiry',
      'boosted_visibility',
      // The Reports page (sales & staff) — AnalyticsController::staffProductivity requires 'pro'.
      'reports',
    ]);

    // Features that require PREMIUM. advanced_dashboard = branch comparison
    // (AnalyticsController::branchComparison requires 'premium').
    const premiumFeatures = new Set<GatedFeature>([
      'featured_visibility',
      'custom_branding',
      'advanced_dashboard',
    ]);

    if (tier === 'pro') {
      // Pro users are gated only from premium-only features
      return premiumFeatures.has(feature);
    }

    if (tier === 'basic') {
      // Basic users are gated from everything PRO and PREMIUM
      return proFeatures.has(feature) || premiumFeatures.has(feature);
    }

    return false;
  };

  return { tier, maxBranches, loading, isGated };
}
