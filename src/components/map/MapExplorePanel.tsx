'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Clock, LocateFixed, Search, SlidersHorizontal, Store, X } from 'lucide-react';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { SavedLocation } from '@/lib/customerLocation';
import MapShopCard from './MapShopCard';
import MapSidebarSelectedStore from './MapSidebarSelectedStore';
import { DISTRICTS } from './mapTypes';

interface MapExplorePanelProps {
  readonly isSelectMode: boolean;
  readonly onBack: () => void;
  readonly q: string;
  readonly onQueryChange: (q: string) => void;
  readonly onSubmitSearch: () => void;
  readonly openOnly: boolean;
  readonly onToggleOpenOnly: () => void;
  readonly district: string;
  readonly onDistrictChange: (d: string) => void;
  readonly userLocation: { lat: number; lng: number } | null;
  readonly locating: boolean;
  readonly onNearMe: () => void;
  readonly hasActiveFilters: boolean;
  readonly onResetFilters: () => void;
  readonly branches: DiscoveryMapBranch[];
  readonly loading: boolean;
  readonly selectedBranch: DiscoveryMapBranch | null;
  readonly onSelectBranch: (b: DiscoveryMapBranch | null) => void;
  readonly onConfirmLocation: (loc?: SavedLocation) => void;
  readonly onDirections: (b: DiscoveryMapBranch) => void;
  readonly pickedAddress?: string;
  readonly reverseLoading?: boolean;
}

/**
 * The Tailor Locator's floating panel over a full-screen map (left column on
 * tablet/desktop, bottom sheet on phones): search, an Open-now toggle, a
 * filter menu, then the shop list — or, once a shop is picked, its details.
 */
export default function MapExplorePanel(p: MapExplorePanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const districtActive = !!p.district && p.district !== 'all';
  const title = p.isSelectMode ? 'Choose a Location' : `Explore Shops${districtActive ? ` (${p.district})` : ' (All)'}`;

  const chip = (on: boolean) =>
    `inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${
      on ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-body hover:border-ink'
    }`;

  return (
    <section
      aria-label="Tailor Locator"
      className="absolute inset-x-2 bottom-2 z-[1100] flex max-h-[52dvh] flex-col overflow-hidden rounded-2xl border border-line bg-canvas shadow-[0_10px_30px_rgba(45,42,38,0.18)] md:inset-x-auto md:left-4 md:top-4 md:bottom-4 md:max-h-none md:w-[400px]"
    >
      {/* Search row */}
      <div className="relative flex items-center gap-2 border-b border-line p-3">
        <button type="button" onClick={p.onBack} aria-label="Back" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted hover:bg-sunken hover:text-ink cursor-pointer">
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); p.onSubmitSearch(); }}
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-taupe"
        >
          <Search size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
          <input
            value={p.q}
            onChange={(e) => p.onQueryChange(e.target.value)}
            placeholder={p.isSelectMode ? 'Search an address or shop…' : 'Search shop or garment…'}
            aria-label="Search shops or garments"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {p.q && (
            <button type="button" onClick={() => p.onQueryChange('')} aria-label="Clear search" className="text-ink-faint hover:text-ink cursor-pointer">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </form>
        {!p.isSelectMode && (
          <button type="button" onClick={p.onToggleOpenOnly} aria-pressed={p.openOnly} className={chip(p.openOnly)}>
            <Clock size={15} aria-hidden="true" /> Open
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Filters"
          className={`${chip(showFilters || districtActive || !!p.userLocation)} relative w-10 justify-center px-0`}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {(districtActive || p.userLocation) && !showFilters && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-canvas bg-taupe" aria-hidden="true" />}
        </button>

        {showFilters && (
          <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-10 space-y-3 rounded-xl border border-line bg-surface p-3.5 shadow-[0_8px_24px_rgba(45,42,38,0.16)]">
            <button type="button" onClick={p.onNearMe} disabled={p.locating} className={`${chip(!!p.userLocation)} w-full justify-center`}>
              <LocateFixed size={15} aria-hidden="true" /> {p.locating ? 'Locating…' : p.userLocation ? 'Near me (on)' : 'Shops near me'}
            </button>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-muted">District</p>
              <div className="flex flex-wrap gap-1.5">
                {['all', ...DISTRICTS].map((d) => {
                  const on = d === 'all' ? !districtActive : p.district === d;
                  return (
                    <button key={d} type="button" onClick={() => p.onDistrictChange(d === 'all' ? '' : d)} aria-pressed={on}
                      className={`h-9 rounded-lg border px-3 text-xs font-medium cursor-pointer ${on ? 'border-ink bg-ink text-white' : 'border-line text-ink-body hover:border-ink'}`}>
                      {d === 'all' ? 'All' : d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <button type="button" onClick={p.onResetFilters} disabled={!p.hasActiveFilters} className="text-xs font-semibold text-taupe underline-offset-2 hover:underline disabled:text-ink-faint disabled:no-underline cursor-pointer">
                Clear filters
              </button>
              <button type="button" onClick={() => setShowFilters(false)} className="h-9 rounded-lg bg-ink px-4 text-xs font-semibold text-white cursor-pointer">Done</button>
            </div>
          </div>
        )}
      </div>

      {p.selectedBranch ? (
        <MapSidebarSelectedStore
          branch={p.selectedBranch}
          onClose={() => p.onSelectBranch(null)}
          isSelectMode={p.isSelectMode}
          userLocation={p.userLocation}
          onConfirmLocation={p.onConfirmLocation}
          onDirections={p.onDirections}
        />
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2 px-4 pb-2 pt-3">
            <h1 className="text-display text-lg text-ink">{title}</h1>
            {!p.loading && <span className="text-sm font-semibold tabular-nums text-ink-muted">{p.branches.length}</span>}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3" aria-busy={p.loading}>
            {p.loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex animate-pulse gap-3 rounded-xl border border-line bg-surface p-2.5">
                  <div className="h-[76px] w-[76px] rounded-lg bg-sunken" />
                  <div className="flex-1 space-y-2 py-1"><div className="h-4 w-2/3 rounded bg-sunken" /><div className="h-3 w-full rounded bg-sunken" /><div className="h-3 w-1/3 rounded bg-sunken" /></div>
                </div>
              ))
            ) : p.branches.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <Store size={26} className="mb-2 text-ink-faint" aria-hidden="true" />
                <p className="text-sm font-semibold text-ink">No shops match</p>
                <p className="mt-1 text-xs text-ink-muted">Try another search, turn off Open, or clear filters.</p>
                {(p.hasActiveFilters || p.openOnly) && (
                  <button type="button" onClick={p.onResetFilters} className="mt-3 h-9 rounded-lg border border-line-strong px-4 text-xs font-semibold text-ink hover:border-ink cursor-pointer">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              p.branches.map((b) => (
                <MapShopCard key={`${b.storeSlug}-${b.branchId}`} branch={b} active={false} onSelect={(x) => p.onSelectBranch(x)} />
              ))
            )}
          </div>

          {p.isSelectMode && (
            <div className="shrink-0 space-y-2 border-t border-line bg-surface p-3">
              <p className="text-xs font-semibold text-ink-muted">Pinned address</p>
              <p className="line-clamp-2 text-sm font-medium text-ink">
                {p.reverseLoading ? 'Locating address…' : p.pickedAddress || 'Move the map or pick a shop.'}
              </p>
              <button type="button" onClick={() => p.onConfirmLocation()}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-ink text-sm font-semibold text-white hover:bg-black cursor-pointer">
                <Check size={16} aria-hidden="true" /> Choose this location
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
