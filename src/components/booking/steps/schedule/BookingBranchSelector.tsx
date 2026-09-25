import React from 'react';
import { MapPin } from 'lucide-react';
import { Branch, StoreSettings } from '../../types';

interface BookingBranchSelectorProps {
  readonly storeSettings: StoreSettings | null;
  readonly branchAutoFilled: boolean;
  readonly autoFilledBranch: Branch | null;
  readonly branchesWithDistance: Branch[];
  readonly selectedBranchId: string;
  readonly setSelectedBranchId: (val: string) => void;
  readonly userLocation: { lat: number; lng: number } | null;
}

export default function BookingBranchSelector({
  storeSettings,
  branchAutoFilled,
  autoFilledBranch,
  branchesWithDistance,
  selectedBranchId,
  setSelectedBranchId,
  userLocation,
}: BookingBranchSelectorProps) {
  if (storeSettings?.branches && storeSettings.branches.length > 1 && !(branchAutoFilled && autoFilledBranch)) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="mobile-h4 text-ink block">
            Select Branch <span className="text-danger">*</span>
          </label>
          {userLocation && (
            <span className="mobile-caption text-ink-faint flex items-center gap-1 font-normal">
              <MapPin size={12} className="text-taupe" /> Sorted by nearest
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {branchesWithDistance.map((b) => {
            const isSelected = selectedBranchId === String(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBranchId(String(b.id))}
                className={`min-h-[56px] p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-taupe bg-taupe/5 ring-2 ring-taupe/20'
                    : 'border-line bg-surface hover:border-taupe/40'
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-taupe bg-taupe' : 'border-line bg-surface'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-ink' : 'text-ink-body'}`}>
                      {b.name}
                    </p>
                    {b.distanceKm !== null && b.distanceKm !== undefined && (
                      <span className="text-xs text-taupe font-semibold shrink-0">
                        {b.distanceKm < 1
                          ? `${Math.round(b.distanceKm * 1000)}m away`
                          : `${b.distanceKm.toFixed(1)} km away`}
                      </span>
                    )}
                  </div>
                  {b.address && (
                    <p className="mobile-caption text-ink-faint mt-0.5 line-clamp-1 font-normal">{b.address}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (storeSettings?.branches && storeSettings.branches.length === 1) {
    return (
      <div className="space-y-1.5">
        <label className="mobile-h4 text-ink block">Branch Location</label>
        <div className="p-3.5 bg-surface border border-line rounded-xl flex items-center gap-3 min-h-[56px]">
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
