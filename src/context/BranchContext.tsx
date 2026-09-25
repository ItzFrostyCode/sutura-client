'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export interface Branch {
  id: number;
  store_id: number;
  name: string;
  slug?: string;
  address: string;
  landmark?: string;
  city: string;
  contact_number?: string;
  is_main: boolean;
  status: string;
  staff_profiles_count?: number;
  job_orders_count?: number;
  manager?: {
    id: number;
    role: string;
    user?: {
      id: number;
      name: string;
      email: string;
      phone?: string | null;
      profile_picture?: string | null;
    } | null;
  } | null;
}

interface BranchContextValue {
  branches: Branch[];
  selectedBranchId: number | null; // null means "All Branches"
  setSelectedBranchId: (id: number | null) => void;
  loadingBranches: boolean;
  refreshBranches: () => void;
}

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

export function BranchProvider({ children }: { readonly children: React.ReactNode }) {
  const { store, user, staffProfile } = useAuthStore();
  const storeId = store?.id;
  
  const roleNames = user?.roles?.map(r => r.name) || [];
  const isStoreOwner = roleNames.includes('store_owner');
  const isBranchManager = roleNames.includes('branch_manager') || Boolean(staffProfile?.is_branch_manager);
  const isStaff = roleNames.includes('staff') || Boolean(staffProfile);
  const canAccessBranches = isStoreOwner || isBranchManager || isStaff;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [loadingBranches, setLoadingBranches] = useState(false);
  // Guards the localStorage-write effect below. Without it, that effect fires
  // on the very first render (storeId truthy, selectedBranchId still its
  // initial `null`) and writes 'all' to localStorage *before* refreshBranches
  // has resolved the real default — which then reads that just-written 'all'
  // back as if it were a genuine saved preference and short-circuits its own
  // "fall back to main branch" logic. Net effect: every first-ever visit
  // (fresh browser/cleared storage) permanently landed on "All Branches"
  // instead of the intended main-branch default. Confirmed live via an
  // actual browser session, not just API calls — this loop never shows up
  // in a request/response test since it's purely a client-side render-order
  // race with localStorage.
  const hasResolvedInitialRef = useRef(false);

  const refreshBranches = useCallback(async () => {
    await Promise.resolve();
    // !storeId is not a real resolution — on a hard reload, auth/store takes a
    // beat to rehydrate, so storeId is transiently falsy before it's actually
    // known. Marking hasResolvedInitialRef true here (as an earlier version
    // of this fix did) let the persist-effect write 'all' during that
    // transient flash, permanently clobbering a real cached selection before
    // the real fetch below ever got to read it. Bail out inert instead —
    // this effect re-fires on its own once storeId arrives, since
    // refreshBranches itself changes identity when storeId changes.
    if (!storeId || !canAccessBranches) {
      setBranches([]);
      setSelectedBranchId(null);
      hasResolvedInitialRef.current = true;
      return;
    }
    setLoadingBranches(true);
    try {
      const res = await api.get(`/stores/${storeId}/branches`);
      if (res.data?.success) {
        const list: Branch[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setBranches(list);

        // For regular artisans assigned to a specific branch, default to their branch
        if (!isStoreOwner && !isBranchManager && staffProfile?.store_branch_id) {
          setSelectedBranchId(staffProfile.store_branch_id);
          setLoadingBranches(false);
          hasResolvedInitialRef.current = true;
          return;
        }

        // Restore from localStorage or default to main branch
        const cached = localStorage.getItem(`sutura_branch_${storeId}`);
        if (cached) {
          const parsed = cached === 'all' ? null : Number.parseInt(cached, 10);
          if (parsed === null || list.some(b => b.id === parsed)) {
            setSelectedBranchId(parsed);
            setLoadingBranches(false);
            hasResolvedInitialRef.current = true;
            return;
          }
        }

        // Fallback: main branch
        const main = list.find(b => b.is_main);
        if (main) {
          setSelectedBranchId(main.id);
        } else if (list.length > 0) {
          setSelectedBranchId(list[0].id);
        } else {
          setSelectedBranchId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoadingBranches(false);
      hasResolvedInitialRef.current = true;
    }
  }, [storeId, canAccessBranches, isStoreOwner, isBranchManager, staffProfile]);

  useEffect(() => {
    Promise.resolve().then(() => {
      refreshBranches();
    });
  }, [refreshBranches]);

  useEffect(() => {
    if (storeId && hasResolvedInitialRef.current) {
      localStorage.setItem(`sutura_branch_${storeId}`, selectedBranchId === null ? 'all' : selectedBranchId.toString());
    }
  }, [storeId, selectedBranchId]);

  const contextValue = useMemo<BranchContextValue>(() => ({
    branches,
    selectedBranchId,
    setSelectedBranchId,
    loadingBranches,
    refreshBranches,
  }), [branches, selectedBranchId, loadingBranches, refreshBranches]);

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextValue {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used inside a BranchProvider');
  }
  return context;
}
