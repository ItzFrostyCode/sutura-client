'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import type { RecentLocation, SavedLocation } from '@/lib/customerLocation';
import RecentItemMenu from './RecentItemMenu';

interface RecentLocationsListProps {
  readonly recents: RecentLocation[];
  readonly onClearAll: () => void;
  readonly onSelectLocation: (loc: SavedLocation) => void;
  readonly onDeleteRecent: (lat: number, lng: number) => void;
  readonly getDistanceLabel: (lat: number, lng: number) => string;
}

export default function RecentLocationsList({
  recents,
  onClearAll,
  onSelectLocation,
  onDeleteRecent,
  getDistanceLabel,
}: RecentLocationsListProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Recent Places</p>
        {recents.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-semibold text-ink-muted hover:text-danger transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {recents.length > 0 ? (
        <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-xs">
          {recents.map((loc, idx) => (
            <div
              key={`${loc.lat}-${loc.lng}-${idx}`}
              className="flex items-center gap-3.5 px-3.5 hover:bg-sunken transition-colors"
            >
              <button
                type="button"
                onClick={() => onSelectLocation(loc)}
                className="flex items-start gap-3.5 py-3.5 flex-1 min-w-0 text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5 text-ink-muted">
                  <Clock size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink line-clamp-1">{loc.address.split(',')[0]}</p>
                  <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                    <span className="font-semibold text-taupe">{getDistanceLabel(loc.lat, loc.lng)}</span>
                    {' · '}
                    {loc.address}
                  </p>
                </div>
              </button>
              <RecentItemMenu
                onUse={() => onSelectLocation(loc)}
                onDelete={() => onDeleteRecent(loc.lat, loc.lng)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-2xl p-7 text-center">
          <Clock size={26} className="mx-auto text-ink-faint mb-2" />
          <p className="text-xs font-medium text-ink-muted">No recent locations yet.</p>
          <p className="text-[11px] text-ink-faint mt-0.5">Pick a suggested place or choose on the map.</p>
        </div>
      )}
    </section>
  );
}
