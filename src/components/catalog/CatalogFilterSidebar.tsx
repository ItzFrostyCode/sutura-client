'use client';

import React from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';


interface CatalogFilterSidebarProps {
  readonly activeFiltersCount: number;
  readonly onResetAll: () => void;
  /** The filter sections (catalog and service pages each pass their own). */
  readonly children: React.ReactNode;
}

// Tablet/desktop: persistent left rail. Phones get CatalogFilterSheet
// (opened from the Filter button next to the search box) instead.
export default function CatalogFilterSidebar({ activeFiltersCount, onResetAll, children }: Readonly<CatalogFilterSidebarProps>) {
  return (
    <aside className="hidden md:block w-[220px] lg:w-[250px] shrink-0 border border-line bg-surface self-start">
      <div className="bg-ink text-white px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-white/70" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="px-1.5 bg-taupe text-white text-[10px] font-black">{activeFiltersCount}</span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button type="button" onClick={onResetAll} className="text-[11px] font-semibold text-white/70 hover:text-white underline cursor-pointer flex items-center gap-1">
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>
      {children}
    </aside>
  );
}
