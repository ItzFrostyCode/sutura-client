'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import type { RecentLocation, SavedLocation } from '@/lib/customerLocation';
import LocationRow from './LocationRow';
import RecentItemMenu from './RecentItemMenu';

interface RecentLocationsListProps {
  readonly recents: RecentLocation[];
  readonly onClearAll: () => void;
  readonly onSelectLocation: (loc: SavedLocation) => void;
  readonly onDeleteRecent: (lat: number, lng: number) => void;
  readonly getDistanceLabel: (lat: number, lng: number) => string;
}

export default function RecentLocationsList({ recents, onClearAll, onSelectLocation, onDeleteRecent, getDistanceLabel }: RecentLocationsListProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-medium text-ink-muted">Recent places</p>
        {recents.length > 0 && (
          <button type="button" onClick={onClearAll} className="-my-3 min-h-[44px] px-1 text-sm text-ink-muted transition-colors hover:text-danger">Clear all</button>
        )}
      </div>

      {recents.length > 0 ? (
        <div className="card-soft p-2">
          {recents.map((loc, idx) => (
            <div key={`${loc.lat}-${loc.lng}-${idx}`} className="flex items-center">
              <div className="min-w-0 flex-1">
                <LocationRow
                  icon={<Clock size={22} />}
                  title={loc.address.split(',')[0]}
                  subtitle={<><span className="text-taupe">{getDistanceLabel(loc.lat, loc.lng)}</span>{' · '}{loc.address}</>}
                  onClick={() => onSelectLocation(loc)}
                  chevron={false}
                />
              </div>
              <RecentItemMenu onUse={() => onSelectLocation(loc)} onDelete={() => onDeleteRecent(loc.lat, loc.lng)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card-soft px-6 py-8 text-center">
          <Clock size={26} className="mx-auto mb-2 text-ink-faint" />
          <p className="mobile-body-md text-ink-muted">No recent locations yet.</p>
          <p className="mobile-body-sm mt-0.5 text-ink-faint">Pick a suggested place or choose on the map.</p>
        </div>
      )}
    </section>
  );
}
