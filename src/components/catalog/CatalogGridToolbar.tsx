'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import { RANK_CHIPS } from './catalogSort';

interface CatalogGridToolbarProps<T extends string> {
  readonly searchQuery: string;
  readonly setSearchQuery: (v: string) => void;
  readonly sortOrder: T;
  readonly setSortOrder: (v: T) => void;
  /** The round rank chips; defaults to the catalog's Sold / Top Rated / Most Viewed. */
  readonly chips?: { value: T; label: string }[];
  readonly searchPlaceholder?: string;
  readonly activeFiltersCount: number;
  readonly onOpenFilters: () => void;
}

// Search takes the row; the Filter button sits on its right on phones (tablet
// and desktop have the persistent filter sidebar instead). Under it, three
// round chips rank the grid — exactly one is active at a time.
export default function CatalogGridToolbar<T extends string>({
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  chips,
  searchPlaceholder = 'Search by design name...',
  activeFiltersCount,
  onOpenFilters,
}: CatalogGridToolbarProps<T>) {
  const rankChips = (chips ?? (RANK_CHIPS as unknown as { value: T; label: string }[]));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchPlaceholder}
            className="w-full"
            onCanvasBackground
          />
        </div>
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Open filters"
          className={`md:hidden h-11 px-3.5 border shrink-0 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
            activeFiltersCount > 0 ? 'bg-ink text-white border-ink' : 'bg-surface text-ink border-line hover:bg-sunken'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <span className="min-w-5 h-5 px-1 bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar" role="group" aria-label="Rank designs by">
        {rankChips.map(chip => {
          const active = sortOrder === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              aria-pressed={active}
              onClick={() => setSortOrder(chip.value)}
              className={`h-9 px-4 rounded-full border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active ? 'bg-ink text-white border-ink' : 'bg-surface text-ink-body border-line hover:border-ink'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
