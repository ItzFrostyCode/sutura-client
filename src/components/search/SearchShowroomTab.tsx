'use client';

import React from 'react';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { SearchActiveTab } from './types';
import SearchNoResults from './SearchNoResults';
import { addRecentItem } from '@/lib/recentSearches';

interface SearchShowroomTabProps {
  readonly activeTab: SearchActiveTab;
  readonly total: number;
  readonly sortBy: string;
  readonly setSortBy: (val: string) => void;
  readonly loading: boolean;
  readonly items: CatalogItemResult[];
  readonly page: number;
  readonly setPage: React.Dispatch<React.SetStateAction<number>>;
  readonly lastPage: number;
  readonly userCoords: { lat: number; lng: number } | null;
  /** What was searched, for the "nothing found" screen. */
  readonly query?: string;
  readonly district?: string;
  /** Search for a garment (a tile on the "nothing found" screen). */
  readonly onSearch?: (term: string) => void;
}

export default function SearchShowroomTab({
  activeTab,
  total,
  sortBy,
  setSortBy,
  loading,
  items,
  page,
  setPage,
  lastPage,
  userCoords,
  query,
  district,
  onSearch,
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
      <div className="flex flex-wrap items-center gap-2 py-0.5 min-w-0 mb-2.5" role="group" aria-label="Sort designs">
        <button
          type="button"
          onClick={() => setSortBy('')}
          className={`flex h-11 shrink-0 items-center px-4 text-sm rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
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
          className={`flex h-11 shrink-0 items-center px-4 text-sm rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
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
          className={`flex h-11 shrink-0 items-center gap-1 px-4 text-sm rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
            sortBy.startsWith('price')
              ? 'bg-ink text-white border-ink font-semibold'
              : 'bg-surface border-line text-ink-muted hover:border-line-strong'
          }`}
        >
          <span>Price</span>
          {sortBy === 'price_asc' && <TrendingUp size={14} className="text-white" aria-label="low to high" />}
          {sortBy === 'price_desc' && <TrendingDown size={14} className="text-white" aria-label="high to low" />}
        </button>
      </div>

      <div className="flex items-center justify-between mb-3 px-0.5">
        <p className="mobile-body-sm text-ink-muted">{loading ? 'Searching designs…' : `${total} design${total === 1 ? '' : 's'} found`}</p>
      </div>

      {/* Skeleton loading state — mirrors CatalogItemCard's exact structure
          (aspect-3/4 image, 2-line name, price, rating|sold, clock turnaround, location) so nothing
          shifts size when the real cards swap in. */}
      {loading && (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-surface border border-line overflow-hidden">
              <div className="aspect-3/4 bg-sunken animate-pulse" />
              <div className="p-2 sm:p-2.5 space-y-1.5">
                <div className="h-3.5 w-full bg-sunken rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-sunken rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-sunken rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-sunken rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-sunken rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-sunken rounded animate-pulse pt-1 border-t border-line/40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nothing found: the same screen as Shops — garment tiles, then the nearby shops under a line. */}
      {!loading && items.length === 0 && onSearch && (
        <SearchNoResults query={query ?? ''} what="designs" district={district} onSearch={onSearch} userCoords={userCoords} />
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {items.map((item) => (
              // Tapping a design puts it in the recent searches.
              <div key={item.id} className="contents" onClickCapture={() => addRecentItem({ kind: 'design', term: item.name, href: item.store ? `/store/${item.store.slug}/catalog/${item.id}` : undefined })}>
                <CatalogItemCard item={item} userCoords={userCoords} />
              </div>
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="mobile-body-sm text-ink-muted px-2">
                Page {page} of {lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
