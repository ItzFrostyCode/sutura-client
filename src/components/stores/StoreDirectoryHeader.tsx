'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, SlidersHorizontal, LocateFixed } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';
import { DISTRICTS, SORT_OPTIONS } from './storesTypes';

interface StoreDirectoryHeaderProps {
  q: string;
  setQ: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  specialization: string;
  setSpecialization: (val: string) => void;
  openNow: boolean;
  setOpenNow: (val: boolean) => void;
  userLocation: { lat: number; lng: number } | null;
  locating: boolean;
  handleNearMe: () => void;
  filterOpen: boolean;
  setFilterOpen: (fn: (v: boolean) => boolean) => void;
}

export default function StoreDirectoryHeader({
  q,
  setQ,
  sortBy,
  setSortBy,
  district,
  setDistrict,
  specialization,
  setSpecialization,
  openNow,
  setOpenNow,
  userLocation,
  locating,
  handleNearMe,
  filterOpen,
  setFilterOpen,
}: Readonly<StoreDirectoryHeaderProps>) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="h-[52px] sm:h-[56px] flex items-center px-1 sm:px-3 gap-1">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="btn-icon-mobile text-ink hover:text-taupe touch-target-48"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Title — single H1 per screen view */}
        <h1 className="flex-1 text-center mobile-h4 font-semibold text-ink">All Stores</h1>

        {/* Search + Filter icons */}
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Search"
            onClick={() => {
              const el = document.getElementById('stores-search-input');
              el?.focus();
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="btn-icon-mobile text-ink hover:text-taupe touch-target-48"
          >
            <Search size={22} />
          </button>
          <button
            type="button"
            aria-label="Filter"
            onClick={() => setFilterOpen((v) => !v)}
            className={`btn-icon-mobile touch-target-48 transition-colors ${
              filterOpen ? 'text-taupe' : 'text-ink hover:text-taupe'
            }`}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Collapsible filter strip */}
      {filterOpen && (
        <div className="px-3 pb-3 border-t border-line space-y-2.5">
          <SearchInput
            id="stores-search-input"
            value={q}
            onChange={setQ}
            placeholder="Search store name..."
            className="w-full"
          />
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="shrink-0 h-11 px-3 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe"
            >
              <option value="">All Davao City</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="shrink-0 h-11 px-3 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe"
            >
              <option value="">All Specializations</option>
              {STORE_SPECIALIZATIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <label className="shrink-0 h-11 flex items-center gap-2 px-3 bg-canvas border border-line rounded-lg text-sm text-ink cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => setOpenNow(e.target.checked)}
                className="w-4 h-4 accent-taupe"
              />
              Open Now
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={!!userLocation}
              className="shrink-0 h-11 px-3 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe disabled:opacity-50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNearMe}
              disabled={locating}
              className={`shrink-0 h-11 flex items-center gap-2 px-3.5 text-sm font-semibold border rounded-lg whitespace-nowrap transition-colors disabled:opacity-60 ${
                userLocation
                  ? 'bg-taupe border-taupe text-white hover:bg-taupe-hover'
                  : 'bg-canvas border-line text-ink hover:border-taupe'
              }`}
            >
              <LocateFixed size={16} />
              {locating ? 'Locating…' : userLocation ? 'Near Me: On' : 'Near Me'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
