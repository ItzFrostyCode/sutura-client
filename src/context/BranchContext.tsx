'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export interface Branch {
  id: number;
  shop_id: number;
  name: string;
  address: string;
  landmark?: string;
  city: string;
  contact_number?: string;
  is_main: boolean;
  status: string;
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
  const { shop, user } = useAuthStore();
  const shopId = shop?.id;
  // Branch management/switching is an owner-only concept (matches the
  // shop_owner-only /shops/{shop}/branches route) — staff and branch managers
  // share the same dashboard now, so this must not fire for them or every
  // page load 403s and surfaces a console error/toast for no reason.
  const isShopOwner = user?.roles?.[0]?.name === 'shop_owner';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [loadingBranches, setLoadingBranches] = useState(false);
  // Guards the localStorage-write effect below. Without it, that effect fires
  // on the very first render (shopId truthy, selectedBranchId still its
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
    // !shopId is not a real resolution — on a hard reload, auth/shop takes a
    // beat to rehydrate, so shopId is transiently falsy before it's actually
    // known. Marking hasResolvedInitialRef true here (as an earlier version
    // of this fix did) let the persist-effect write 'all' during that
    // transient flash, permanently clobbering a real cached selection before
    // the real fetch below ever got to read it. Bail out inert instead —
    // this effect re-fires on its own once shopId arrives, since
    // refreshBranches itself changes identity when shopId changes.
    if (!shopId) {
      return;
    }
    if (!isShopOwner) {
      setBranches([]);
      setSelectedBranchId(null);
      hasResolvedInitialRef.current = true;
      return;
    }
    setLoadingBranches(true);
    try {
      const res = await api.get(`/shops/${shopId}/branches`);
      if (res.data.success) {
        const list: Branch[] = res.data.data || [];
        setBranches(list);

        // Restore from localStorage or default to main branch
        const cached = localStorage.getItem(`sutura_branch_${shopId}`);
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
  }, [shopId, isShopOwner]);

  useEffect(() => {
    Promise.resolve().then(() => {
      refreshBranches();
    });
  }, [refreshBranches]);

  useEffect(() => {
    if (shopId && hasResolvedInitialRef.current) {
      localStorage.setItem(`sutura_branch_${shopId}`, selectedBranchId === null ? 'all' : selectedBranchId.toString());
    }
  }, [shopId, selectedBranchId]);

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
