import React from 'react';
import { MapPin } from 'lucide-react';
import { Branch, StoreSettings } from '../../types';

interface BookingBranchSelectorProps {
  readonly storeSettings: StoreSettings | null;
  readonly branchesWithDistance: Branch[];
  readonly selectedBranchId: string;
  readonly setSelectedBranchId: (val: string) => void;
  readonly userLocation: { lat: number; lng: number } | null;
}

export default function BookingBranchSelector({
  storeSettings,
  branchesWithDistance,
  selectedBranchId,
  setSelectedBranchId,
  userLocation,
}: BookingBranchSelectorProps) {
  // Always defaults to the nearest branch (branchesWithDistance is already
  // distance-sorted, and useBookingWizard seeds selectedBranchId from it) —
  // a compact dropdown to change it, never the old one-card-per-branch list,
  // which turned into a long scroll on any store with more than a few
  // branches. Multi-branch only; a single-branch store still gets the plain
  // static display below.
  if (storeSettings?.branches && storeSettings.branches.length > 1) {
    const selected = branchesWithDistance.find((b) => String(b.id) === selectedBranchId) || branchesWithDistance[0] || null;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="booking-branch" className="mobile-h4 text-ink block">
            Branch <span className="text-danger">*</span>
          </label>
          {userLocation && (
            <span className="mobile-caption text-ink-faint flex items-center gap-1 font-normal">
              <MapPin size={12} className="text-taupe" /> Sorted by nearest
            </span>
          )}
        </div>
        <select
          id="booking-branch"
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="w-full h-[52px] bg-canvas border border-line rounded-none px-4 text-base text-ink focus:outline-none focus:border-taupe"
        >
          {branchesWithDistance.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.name}
              {b.distanceKm !== null && b.distanceKm !== undefined
                ? ` — ${b.distanceKm < 1 ? `${Math.round(b.distanceKm * 1000)}m` : `${b.distanceKm.toFixed(1)}km`} away`
                : ''}
            </option>
          ))}
        </select>
        {selected?.address && (
          <p className="mobile-caption text-ink-faint">{selected.address}</p>
        )}
      </div>
    );
  }

  if (storeSettings?.branches && storeSettings.branches.length === 1) {
    return (
      <div className="space-y-1.5">
        <label className="mobile-h4 text-ink block">Branch Location</label>
        <div className="p-3.5 bg-surface border border-line rounded-none flex items-center gap-3 min-h-[56px]">
          <MapPin size={18} className="text-taupe shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{storeSettings.branches[0].name}</p>
            {storeSettings.branches[0].address && (
              <p className="mobile-caption text-ink-faint mt-0.5 font-normal">{storeSettings.branches[0].address}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
