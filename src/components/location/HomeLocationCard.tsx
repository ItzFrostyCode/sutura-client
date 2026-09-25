'use client';

import React from 'react';
import { Home, Plus } from 'lucide-react';
import type { HomeLocation, SavedLocation } from '@/lib/customerLocation';

interface HomeLocationCardProps {
  readonly homeLocation: HomeLocation | null;
  readonly onOpenSetHome: () => void;
  readonly onSelectLocation: (loc: SavedLocation) => void;
  readonly onRemoveHome: () => void;
  readonly getDistanceLabel: (lat: number, lng: number) => string;
}

export default function HomeLocationCard({
  homeLocation,
  onOpenSetHome,
  onSelectLocation,
  onRemoveHome,
  getDistanceLabel,
}: HomeLocationCardProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Home Address</p>
        {homeLocation && (
          <button
            type="button"
            onClick={onOpenSetHome}
            className="text-[11px] font-semibold text-taupe hover:underline cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {homeLocation ? (
        <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs">
          <div className="flex items-start gap-3.5 p-3.5">
            <div className="w-9 h-9 rounded-full bg-taupe/10 flex items-center justify-center shrink-0 mt-0.5">
              <Home size={17} className="text-taupe" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">{homeLocation.label}</p>
              <p className="text-xs text-ink-muted line-clamp-2 mt-0.5">{homeLocation.address}</p>
              <p className="text-[11px] font-semibold text-taupe mt-1">
                {getDistanceLabel(homeLocation.lat, homeLocation.lng)} from current
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0 self-center">
              <button
                type="button"
                onClick={() => onSelectLocation(homeLocation)}
                className="px-3 py-1.5 bg-taupe text-white text-[11px] font-bold rounded-lg hover:bg-taupe-hover transition-colors cursor-pointer"
              >
                Use
              </button>
              <button
                type="button"
                onClick={onRemoveHome}
                className="px-3 py-1.5 text-danger text-[11px] font-semibold rounded-lg hover:bg-danger/10 transition-colors border border-danger/30 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenSetHome}
          className="w-full flex items-center gap-3 p-3.5 bg-surface border border-line border-dashed rounded-2xl hover:border-taupe hover:bg-taupe/5 transition-all text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
            <Plus size={17} className="text-taupe" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Set a home address</p>
            <p className="text-xs text-ink-muted mt-0.5">Find nearby stores even when you&apos;re far away</p>
          </div>
        </button>
      )}
    </section>
  );
}
