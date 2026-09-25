'use client';

import React from 'react';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { SearchActiveTab } from './types';

interface SearchShowroomTabProps {
  readonly activeTab: SearchActiveTab;
  readonly total: number;
  readonly sortBy: string;
  readonly setSortBy: (val: string) => void;
  readonly loading: boolean;
  readonly showFabric: boolean;
  readonly setShowFabric: React.Dispatch<React.SetStateAction<boolean>>;
  readonly items: CatalogItemResult[];
  readonly page: number;
  readonly setPage: React.Dispatch<React.SetStateAction<number>>;
  readonly lastPage: number;
  readonly userCoords: { lat: number; lng: number } | null;
}

export default function SearchShowroomTab({
  activeTab,
  total,
  sortBy,
  setSortBy,
  loading,
  showFabric,
  setShowFabric,
  items,
  page,
  setPage,
  lastPage,
  userCoords,
}: SearchShowroomTabProps) {
  if (activeTab !== 'showroom' && activeTab !== 'all') {
    return null;
  }

  return (
    <div>
      {activeTab === 'all' && (
        <div className="flex items-center justify-between mb-3 px-1 pt-2 border-t border-line">
          <h2 className="text-base font-bold text-ink">Catalog Designs</h2>
          <span className="text-xs text-ink-muted font-medium">{total}</span>
        </div>
      )}

      {/* Quick Sort Bar */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-0.5 min-w-0 mb-2.5">
        <button
          type="button"
          onClick={() => setSortBy('')}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
            !sortBy
              ? 'bg-ink text-white border-ink font-semibold'
              : 'bg-surface border-line text-ink-muted hover:border-line-strong'
          }`}
        >
          Default
        </button>
        <button
          type="button"
          onClick={() => setSortBy(sortBy === 'top_sales' ? '' : 'top_sales')}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
            sortBy === 'top_sales'
              ? 'bg-ink text-white border-ink font-semibold'
              : 'bg-surface border-line text-ink-muted hover:border-line-strong'
          }`}
        >
          Top Sales
        </button>
        <button
          type="button"
          onClick={() => setSortBy(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap flex items-center gap-0.5 cursor-pointer ${
            sortBy.startsWith('price')
              ? 'bg-ink text-white border-ink font-semibold'
              : 'bg-surface border-line text-ink-muted hover:border-line-strong'
          }`}
        >
          <span>Price</span>
          {sortBy === 'price_asc' && <TrendingUp size={11} className="text-white" />}
          {sortBy === 'price_desc' && <TrendingDown size={11} className="text-white" />}
        </button>
      </div>

      <div className="flex items-center justify-between mb-2 px-0.5">
        <p className="text-[11px] text-ink-faint">{loading ? 'Searching…' : null}</p>

        {/* Model/Fabric Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[11px] font-semibold ${!showFabric ? 'text-ink' : 'text-ink-faint'}`}>Model</span>
          <button
            type="button"
            onClick={() => setShowFabric((v) => !v)}
            aria-label="Toggle between model and fabric photos"
            className={`relative w-8 h-[18px] rounded-full transition-colors cursor-pointer ${
              showFabric ? 'bg-ink' : 'bg-line-strong'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                showFabric ? 'translate-x-[14px]' : ''
              }`}
            />
          </button>
          <span className={`text-[11px] font-semibold ${showFabric ? 'text-ink' : 'text-ink-faint'}`}>Fabric</span>
        </div>
      </div>

      {/* Skeleton loading state — mirrors CatalogItemCard's exact structure
          (aspect-3/4 image, rating row, 2-line name, price row) so nothing
          shifts size when the real cards swap in. */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface border border-line overflow-hidden">
              <div className="aspect-3/4 bg-sunken animate-pulse" />
              <div className="px-1.5 pt-2 pb-2.5">
                <div className="h-4 w-10 bg-sunken rounded animate-pulse mb-1.5" />
                <div className="h-[36px] space-y-1">
                  <div className="h-3.5 w-full bg-sunken rounded animate-pulse" />
                  <div className="h-3.5 w-2/3 bg-sunken rounded animate-pulse" />
                </div>
                <div className="h-4 w-1/2 bg-sunken rounded animate-pulse mt-0.5" />
                <div className="mt-2 pt-1 border-t border-line/40">
                  <div className="h-3.5 w-12 bg-sunken rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="px-4 py-10 text-center">
          <PackageSearch size={28} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold text-ink">No Catalog Designs Found</p>
          <p className="mt-1 text-xs text-ink-muted">No items matched your search. Try a broader term or clear a filter.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {items.map((item) => (
              <CatalogItemCard key={item.id} item={item} showFabric={showFabric} userCoords={userCoords} />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-line text-ink-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-ink-muted px-2">
                Page {page} of {lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="p-2 rounded-lg border border-line text-ink-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
