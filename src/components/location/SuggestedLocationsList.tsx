'use client';

import React from 'react';
import { Scissors, ShoppingBag, MapPin, ChevronRight } from 'lucide-react';
import { SuggestedHub } from './types';
import type { SavedLocation } from '@/lib/customerLocation';

interface SuggestedLocationsListProps {
  readonly dynamicSuggested: SuggestedHub[];
  readonly loadingStores: boolean;
  readonly hubCategory: 'all' | 'stores' | 'malls' | 'districts';
  readonly setHubCategory: (cat: 'all' | 'stores' | 'malls' | 'districts') => void;
  readonly onSelectLocation: (loc: SavedLocation) => void;
  readonly getDistanceLabel: (lat: number, lng: number) => string;
}

export default function SuggestedLocationsList({
  dynamicSuggested,
  loadingStores,
  hubCategory,
  setHubCategory,
  onSelectLocation,
  getDistanceLabel,
}: SuggestedLocationsListProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
            Suggested Places Around Davao
          </p>
          <p className="text-[11px] text-ink-muted">Sorted by nearest distance to your location</p>
        </div>
        {loadingStores && (
          <span className="text-[10px] text-taupe font-semibold animate-pulse">Syncing…</span>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {(
          [
            { id: 'all', label: 'All Davao' },
            { id: 'stores', label: 'Tailor Stores' },
            { id: 'malls', label: 'Malls & Hubs' },
            { id: 'districts', label: 'Districts' },
          ] as const
        ).map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setHubCategory(chip.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              hubCategory === chip.id
                ? 'bg-taupe text-white shadow-xs'
                : 'bg-surface border border-line text-ink-muted hover:text-ink'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Dynamic list sorted by distance */}
      <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-xs">
        {dynamicSuggested.map((hub, idx) => (
          <button
            key={`${hub.lat}-${hub.lng}-${idx}`}
            type="button"
            onClick={() => onSelectLocation(hub)}
            className="w-full flex items-start gap-3.5 p-3.5 text-left hover:bg-sunken transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-taupe/10 flex items-center justify-center shrink-0 mt-0.5 text-taupe">
              {hub.type === 'tailor_store' ? (
                <Scissors size={15} />
              ) : hub.type === 'mall' ? (
                <ShoppingBag size={15} />
              ) : (
                <MapPin size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-ink line-clamp-1">{hub.name}</p>
                {hub.type === 'tailor_store' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-taupe/15 text-taupe shrink-0">
                    Store
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                <span className="font-semibold text-taupe">{getDistanceLabel(hub.lat, hub.lng)}</span>
                {' · '}
                {hub.district}
                {hub.address && hub.address !== hub.name ? ` · ${hub.address}` : ''}
              </p>
            </div>
            <ChevronRight size={16} className="text-ink-faint shrink-0 self-center" />
          </button>
        ))}
      </div>
    </section>
  );
}
