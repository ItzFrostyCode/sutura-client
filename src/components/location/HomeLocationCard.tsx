'use client';

import React from 'react';
import { Home, Plus } from 'lucide-react';
import type { HomeLocation, SavedLocation } from '@/lib/customerLocation';
import LocationRow from './LocationRow';

interface HomeLocationCardProps {
  readonly homeLocation: HomeLocation | null;
  readonly onOpenSetHome: () => void;
  readonly onSelectLocation: (loc: SavedLocation) => void;
  readonly onRemoveHome: () => void;
  readonly getDistanceLabel: (lat: number, lng: number) => string;
}

export default function HomeLocationCard({ homeLocation, onOpenSetHome, onSelectLocation, onRemoveHome, getDistanceLabel }: HomeLocationCardProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-medium text-ink-muted">Home address</p>
        {homeLocation && (
          <button type="button" onClick={onOpenSetHome} className="-my-3 min-h-[44px] px-1 text-sm text-taupe transition-colors hover:text-taupe-hover">Edit</button>
        )}
      </div>

      {homeLocation ? (
        <div className="card-soft flex items-center gap-4 p-4">
          <Home size={22} className="shrink-0 text-taupe" />
          <div className="min-w-0 flex-1">
            <p className="mobile-body-md font-medium text-ink">{homeLocation.label}</p>
            <p className="mobile-body-sm mt-0.5 line-clamp-2 text-ink-muted">{homeLocation.address}</p>
            <p className="mobile-caption mt-1 text-taupe">{getDistanceLabel(homeLocation.lat, homeLocation.lng)} from current</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button type="button" onClick={() => onSelectLocation(homeLocation)} className="h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-taupe">Use</button>
            <button type="button" onClick={onRemoveHome} className="h-11 px-3 text-sm text-danger transition-opacity hover:opacity-70">Remove</button>
          </div>
        </div>
      ) : (
        <div className="card-soft p-2">
          <LocationRow icon={<Plus size={22} />} title="Set a home address" subtitle="Find nearby stores even when you’re far away" onClick={onOpenSetHome} />
        </div>
      )}
    </section>
  );
}
