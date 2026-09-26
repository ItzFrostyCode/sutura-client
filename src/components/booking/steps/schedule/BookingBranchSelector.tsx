import React, { useState, useMemo } from 'react';
import { MapPin, Search, X, Check } from 'lucide-react';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selected = useMemo(() => {
    return (
      branchesWithDistance.find((b) => String(b.id) === selectedBranchId) ||
      branchesWithDistance[0] ||
      null
    );
  }, [branchesWithDistance, selectedBranchId]);

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branchesWithDistance;
    const q = searchQuery.toLowerCase().trim();
    return branchesWithDistance.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.city && b.city.toLowerCase().includes(q))
    );
  }, [branchesWithDistance, searchQuery]);

  if (!storeSettings?.branches || storeSettings.branches.length === 0) {
    return null;
  }

  const isMultiBranch = storeSettings.branches.length > 1;

  const formatDistance = (distanceKm: number | null | undefined) => {
    if (distanceKm === null || distanceKm === undefined) return null;
    return distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m away` : `${distanceKm.toFixed(1)} km away`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="mobile-h4 text-ink block">
          Branch {isMultiBranch && <span className="text-danger">*</span>}
        </label>
        {userLocation && isMultiBranch && (
          <span className="mobile-caption text-ink-faint flex items-center gap-1 font-normal">
            <MapPin size={12} className="text-taupe" /> Sorted by nearest
          </span>
        )}
      </div>

      {/* Compact Selected Branch Summary Card */}
      <div className="p-3.5 bg-surface border border-line rounded-none flex items-start justify-between gap-3 min-h-[56px]">
        <div className="flex items-start gap-2.5 min-w-0">
          <MapPin size={18} className="text-taupe shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink leading-tight">
              {selected?.name ?? 'Branch'}
            </p>
            {selected && formatDistance(selected.distanceKm) && (
              <p className="mobile-caption text-taupe font-medium mt-0.5">
                {formatDistance(selected.distanceKm)}
              </p>
            )}
            {selected?.address && (
              <p className="mobile-caption text-ink-faint mt-0.5 font-normal line-clamp-1">
                {selected.address}
                {selected.city ? `, ${selected.city}` : ''}
              </p>
            )}
          </div>
        </div>

        {isMultiBranch && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mobile-caption font-semibold text-taupe hover:underline shrink-0 min-h-[44px] flex items-center px-1 cursor-pointer"
          >
            Change Branch
          </button>
        )}
      </div>

      {/* Branch Selector Modal / Drawer */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="branch-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full sm:max-w-md bg-surface border-t sm:border border-line rounded-none max-h-[85vh] flex flex-col shadow-xl animate-in slide-in-from-bottom-4 sm:fade-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 id="branch-modal-title" className="mobile-h3 font-semibold text-ink">
                  Select Branch
                </h3>
                <p className="mobile-caption text-ink-faint font-normal mt-0.5">
                  Choose which branch you will visit
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
                aria-label="Close branch selector"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-line bg-canvas">
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-ink-faint pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search branch name or address..."
                  className="w-full h-11 pl-9 pr-9 bg-surface border border-line rounded-none text-sm text-ink focus:outline-none focus:border-taupe"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-ink-faint hover:text-ink p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Branch List */}
            <div className="overflow-y-auto max-h-[50vh] divide-y divide-line p-2">
              {filteredBranches.length === 0 ? (
                <div className="p-8 text-center mobile-caption text-ink-faint">
                  No branches found matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredBranches.map((b) => {
                  const isSelected = String(b.id) === selectedBranchId;
                  const distance = formatDistance(b.distanceKm);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBranchId(String(b.id));
                        setModalOpen(false);
                      }}
                      className={`w-full min-h-[56px] p-3 text-left transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-taupe/5 border-l-4 border-l-taupe'
                          : 'hover:bg-sunken border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-taupe' : 'text-ink'
                            }`}
                          >
                            {b.name}
                          </p>
                          {distance && (
                            <span className="text-[10px] font-semibold bg-sunken text-ink-muted px-1.5 py-0.5 rounded-none shrink-0">
                              {distance}
                            </span>
                          )}
                        </div>
                        {b.address && (
                          <p className="mobile-caption text-ink-faint mt-0.5 font-normal line-clamp-1">
                            {b.address}
                            {b.city ? `, ${b.city}` : ''}
                          </p>
                        )}
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-taupe bg-taupe text-white'
                            : 'border-line bg-surface'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
