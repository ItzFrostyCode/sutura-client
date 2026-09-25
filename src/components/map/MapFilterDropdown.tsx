import { X, LocateFixed } from 'lucide-react';
import { DISTRICTS } from './mapTypes';

interface MapFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  district: string;
  onDistrictChange: (dist: string) => void;
  statusFilter: 'all' | 'online' | 'offline';
  onStatusFilterChange: (status: 'all' | 'online' | 'offline') => void;
  userLocation: { lat: number; lng: number } | null;
  locating: boolean;
  onNearMe: () => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export default function MapFilterDropdown({
  isOpen,
  onClose,
  district,
  onDistrictChange,
  statusFilter,
  onStatusFilterChange,
  userLocation,
  locating,
  onNearMe,
  hasActiveFilters,
  onResetFilters,
}: MapFilterDropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1150] md:hidden" onClick={onClose} />
      <div className="md:hidden absolute left-2.5 right-2.5 sm:left-auto sm:right-6 sm:w-80 top-[60px] z-[1200] bg-surface border border-line rounded-2xl p-3.5 sm:p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-1.5 border-b border-line/70">
          <span className="text-xs font-bold text-ink">Filter Stores & Districts</span>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-1 rounded-full hover:bg-sunken cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* District selector */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint block mb-1">
            District
          </label>
          <select
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full bg-canvas border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-taupe"
          >
            <option value="">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Store status */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint block mb-1.5">
            Store Status
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onStatusFilterChange('all')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-ink text-white border-ink font-semibold'
                  : 'bg-canvas text-ink-body border-line hover:border-taupe'
              }`}
            >
              All Stores
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('online')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === 'online'
                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                  : 'bg-canvas text-ink-body border-line hover:border-emerald-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block shrink-0 shadow-xs" />
              Open
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('offline')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === 'offline'
                  ? 'bg-rose-600 text-white border-rose-600 font-semibold shadow-xs'
                  : 'bg-canvas text-ink-body border-line hover:border-rose-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block shrink-0 shadow-xs" />
              Closed
            </button>
          </div>
        </div>

        {/* Near Me sort button */}
        <button
          type="button"
          onClick={onNearMe}
          disabled={locating}
          className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-60 cursor-pointer ${
            userLocation ? 'bg-taupe border-taupe text-white' : 'bg-canvas border-line text-ink'
          }`}
        >
          <LocateFixed size={14} />
          {locating ? 'Locating…' : userLocation ? 'Near Me: On (sorted by distance)' : 'Sort by Near Me'}
        </button>

        {/* Reset button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-1 text-[10px] text-ink-muted border-t border-line/60">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-taupe font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
