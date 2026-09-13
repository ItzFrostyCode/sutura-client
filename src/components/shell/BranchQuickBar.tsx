'use client';

import React from 'react';
import { Star, Building2, MapPin } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * BranchQuickBar:
 * Always-visible multi-branch navigation strip.
 * Directly fulfills the requirement to see the Primary Headquarters (Main Branch)
 * and its satellite companions ("mga kasama niya") without having to hover or open hidden dropdowns.
 */
export default function BranchQuickBar() {
  const { shop } = useAuthStore();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();

  const safeBranches = Array.isArray(branches) ? branches : [];

  // Only render if a shop is loaded and has branches
  if (!shop?.id || safeBranches.length === 0) {
    return null;
  }

  const mainBranch = safeBranches.find(b => b.is_main) || safeBranches[0];
  const satelliteBranches = safeBranches.filter(b => b.id !== mainBranch?.id);

  return (
    <div
      role="toolbar"
      aria-label="Branch Quick Selector"
      className="flex items-center gap-1 p-0.5 bg-sunken/80 border border-line rounded-lg overflow-x-auto hide-scrollbar max-w-full text-xs shrink-0"
    >
      {/* 🌟 Main Branch (Primary Headquarters) */}
      {mainBranch && (
        <button
          type="button"
          onClick={() => setSelectedBranchId(mainBranch.id)}
          title={`Headquarters: ${mainBranch.name}${mainBranch.job_orders_count ? ` (${mainBranch.job_orders_count} orders)` : ''}`}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap min-h-[28px] cursor-pointer ${
            selectedBranchId === mainBranch.id
              ? 'bg-taupe text-white shadow-xs font-semibold'
              : 'text-ink-body hover:text-ink hover:bg-surface/90'
          }`}
        >
          <Star
            size={12}
            className={`shrink-0 ${
              selectedBranchId === mainBranch.id
                ? 'fill-amber-300 text-amber-200'
                : 'fill-amber-400/80 text-amber-500'
            }`}
          />
          <span className="truncate max-w-[120px] sm:max-w-[140px]">{mainBranch.name}</span>
          <span
            className={`text-[10px] uppercase font-bold px-1 rounded ${
              selectedBranchId === mainBranch.id
                ? 'bg-white/20 text-white'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
            }`}
          >
            Main
          </span>
        </button>
      )}

      {/* 🏢 Satellite Branches ("Mga Kasama Niya") */}
      {satelliteBranches.map(branch => {
        const isSelected = selectedBranchId === branch.id;
        return (
          <button
            key={branch.id}
            type="button"
            onClick={() => setSelectedBranchId(branch.id)}
            title={`Satellite: ${branch.name}${branch.job_orders_count ? ` (${branch.job_orders_count} orders)` : ''}`}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap min-h-[28px] cursor-pointer ${
              isSelected
                ? 'bg-taupe text-white shadow-xs font-semibold'
                : 'text-ink-body hover:text-ink hover:bg-surface/90'
            }`}
          >
            <MapPin size={12} className={`shrink-0 ${isSelected ? 'text-white' : 'text-taupe'}`} />
            <span className="truncate max-w-[120px] sm:max-w-[140px]">{branch.name}</span>
            {branch.job_orders_count !== undefined && branch.job_orders_count > 0 && (
              <span
                className={`text-[10px] font-mono px-1 rounded-full ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-sunken text-ink-muted'
                }`}
              >
                {branch.job_orders_count}
              </span>
            )}
          </button>
        );
      })}

      {/* 🌐 All Branches (Aggregated Network View) */}
      {safeBranches.length > 1 && (
        <button
          type="button"
          onClick={() => setSelectedBranchId(null)}
          title="Consolidated view across all shop locations"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap min-h-[28px] cursor-pointer ${
            selectedBranchId === null
              ? 'bg-taupe text-white shadow-xs font-semibold'
              : 'text-ink-body hover:text-ink hover:bg-surface/90'
          }`}
        >
          <Building2 size={12} className={`shrink-0 ${selectedBranchId === null ? 'text-white' : 'text-ink-muted'}`} />
          <span>All ({safeBranches.length})</span>
        </button>
      )}
    </div>
  );
}
