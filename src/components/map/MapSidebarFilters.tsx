import { LocateFixed, RotateCcw } from 'lucide-react';
import { DISTRICTS } from './mapTypes';

interface MapSidebarFiltersProps {
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

export default function MapSidebarFilters({
  district,
  onDistrictChange,
  statusFilter,
  onStatusFilterChange,
  userLocation,
  locating,
  onNearMe,
  hasActiveFilters,
  onResetFilters,
}: MapSidebarFiltersProps) {
  return (
    <div className="p-3.5 border-b border-line bg-surface/50 space-y-3 shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
          Filters
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] font-semibold text-taupe hover:text-ink cursor-pointer transition-colors"
          >
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>

      {/* District Dropdown */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
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

      {/* Status Buttons */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
          Status
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            className={`py-1 px-1.5 rounded-md text-[11px] font-medium border text-center transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-ink text-white border-ink font-semibold'
                : 'bg-canvas text-ink-body border-line hover:border-taupe'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('online')}
            className={`py-1 px-1.5 rounded-md text-[11px] font-medium border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              statusFilter === 'online'
                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                : 'bg-canvas text-ink-body border-line hover:border-emerald-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block" />
            Open
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('offline')}
            className={`py-1 px-1.5 rounded-md text-[11px] font-medium border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              statusFilter === 'offline'
                ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                : 'bg-canvas text-ink-body border-line hover:border-rose-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] inline-block" />
            Closed
          </button>
        </div>
      </div>

      {/* Near Me Toggle */}
      <button
        type="button"
        onClick={onNearMe}
        disabled={locating}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-60 cursor-pointer ${
          userLocation ? 'bg-taupe text-white border-taupe' : 'bg-canvas text-ink border-line hover:border-taupe'
        }`}
      >
        <LocateFixed size={13} className={locating ? 'animate-pulse' : ''} />
        {locating ? 'Locating…' : userLocation ? 'Sorted by Near Me' : 'Sort by Near Me'}
      </button>
    </div>
  );
}
