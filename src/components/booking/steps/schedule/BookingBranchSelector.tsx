import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Branch, StoreSettings } from '../../types';

interface BookingBranchSelectorProps {
  readonly storeSettings: StoreSettings | null;
  readonly branchesWithDistance: Branch[];
  readonly selectedBranchId: string;
  readonly setSelectedBranchId?: (val: string) => void;
  readonly userLocation?: { lat: number; lng: number } | null;
}

/**
 * Read-only: the branch is locked to the shop the customer chose before
 * booking (the ?branch= they came from, otherwise the main branch). There is
 * no "nearest" sorting and no way to switch branches from here.
 */
export default function BookingBranchSelector({
  storeSettings,
  branchesWithDistance,
  selectedBranchId,
}: BookingBranchSelectorProps) {
  const selected = useMemo(
    () => branchesWithDistance.find((b) => String(b.id) === selectedBranchId) || null,
    [branchesWithDistance, selectedBranchId]
  );

  if (!storeSettings?.branches || storeSettings.branches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2" data-field="booking-branch">
      <p className="mobile-h4 text-ink">Branch</p>

      <div className="p-3.5 bg-surface border border-line rounded-none flex items-start gap-2.5 min-h-[56px]">
        <MapPin size={18} className="text-taupe shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink leading-tight">
            {selected?.name ?? storeSettings.name ?? 'Branch'}
          </p>
          {selected?.address && (
            <p className="mobile-caption text-ink-faint mt-0.5 font-normal line-clamp-1">
              {selected.address}
              {selected.city ? `, ${selected.city}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
