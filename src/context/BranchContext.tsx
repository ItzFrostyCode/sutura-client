'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  /** No-op unless the user is the store owner. */
  setSelectedBranchId: (id: number | null) => void;
  /** Only the store owner can switch branches or use the consolidated view. */
  canSwitchBranch: boolean;
  loadingBranches: boolean;
  refreshBranches: () => void;
}

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

export function BranchProvider({ children }: { readonly children: React.ReactNode }) {
  const { store, user, staffProfile } = useAuthStore();
  const mustChangePassword = Boolean(user?.must_change_password);
  const storeId = store?.id;
  
  const roleNames = user?.roles?.map(r => r.name) || [];
  const isStoreOwner = roleNames.includes('store_owner');
  const isBranchManager = roleNames.includes('branch_manager') || Boolean(staffProfile?.is_branch_manager);
  const isStaff = roleNames.includes('staff') || Boolean(staffProfile);
  const canAccessBranches = isStoreOwner || isBranchManager || isStaff;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchIdRaw] = useState<number | null>(null);
  // Only the owner may change branch; for anyone else this is a no-op, so no
  // page can move a manager or staff member off their assigned branch.
  const canSwitchBranch = isStoreOwner;
  // The pick is remembered (per tab, per shop) only here, when the owner
  // actually chooses a branch. It used to be saved by an effect that also
  // caught automatic resets: when the signed-in data briefly reloaded (store
  // or roles empty for a moment), the selector fell back to "All Branches"
  // and that got saved as if the owner had picked it.
  const setSelectedBranchId = useCallback((id: number | null) => {
    if (!canSwitchBranch) return;
    setSelectedBranchIdRaw(id);
    if (storeId) {
      try { sessionStorage.setItem(`sutura_branch_${storeId}`, id === null ? 'all' : id.toString()); } catch { /* storage blocked */ }
    }
  }, [canSwitchBranch, storeId]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const refreshBranches = useCallback(async () => {
    await Promise.resolve();
    // No shop yet, or the signed-in data is reloading for a moment (store or
    // roles briefly empty): leave the current pick alone. This re-runs once the
    // data is back and restores the owner's saved pick.
    if (!storeId || !canAccessBranches) {
      setBranches([]);
      return;
    }
    // Admin-issued temporary password not replaced yet: the API refuses
    // store-scoped calls (403 password_change_required) and the dashboard
    // shows ChangePasswordGate instead. Stay inert — this re-fires once the
    // flag clears, since it's in the dependency list below.
    if (mustChangePassword) return;
    setLoadingBranches(true);
    try {
      const res = await api.get(`/stores/${storeId}/branches`);
      if (res.data?.success) {
        const list: Branch[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setBranches(list);

        // Branch managers and staff are locked to their own branch: only the
        // store owner can switch branches (the API enforces the same pin).
        if (!isStoreOwner && staffProfile?.store_branch_id) {
          setSelectedBranchIdRaw(staffProfile.store_branch_id);
          setLoadingBranches(false);
          return;
        }

        // The owner's last pick in this tab, else the main branch.
        let cached: string | null = null;
        try { cached = sessionStorage.getItem(`sutura_branch_${storeId}`); } catch { /* storage blocked */ }
        if (cached) {
          const parsed = cached === 'all' ? null : Number.parseInt(cached, 10);
          if (parsed === null || list.some(b => b.id === parsed)) {
            setSelectedBranchIdRaw(parsed);
            setLoadingBranches(false);
            return;
          }
        }

        // Fallback: main branch
        const main = list.find(b => b.is_main);
        if (main) {
          setSelectedBranchIdRaw(main.id);
        } else if (list.length > 0) {
          setSelectedBranchIdRaw(list[0].id);
        } else {
          setSelectedBranchIdRaw(null);
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  }, [storeId, canAccessBranches, isStoreOwner, isBranchManager, staffProfile, mustChangePassword]);

  useEffect(() => {
    Promise.resolve().then(() => {
      refreshBranches();
    });
  }, [refreshBranches]);

  const contextValue = useMemo<BranchContextValue>(() => ({
    branches,
    selectedBranchId,
    setSelectedBranchId,
    canSwitchBranch,
    loadingBranches,
    refreshBranches,
  }), [branches, selectedBranchId, setSelectedBranchId, canSwitchBranch, loadingBranches, refreshBranches]);

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
}

/** Like useBranch(), but undefined outside the dashboard (no BranchProvider). */
export function useOptionalBranch(): BranchContextValue | undefined {
  return useContext(BranchContext);
}

export function useBranch(): BranchContextValue {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used inside a BranchProvider');
  }
  return context;
}
