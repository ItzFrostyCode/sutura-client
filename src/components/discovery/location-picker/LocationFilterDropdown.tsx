import { X } from 'lucide-react';

interface LocationFilterDropdownProps {
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  statusFilter: 'all' | 'online' | 'offline';
  setStatusFilter: (s: 'all' | 'online' | 'offline') => void;
  onClose: () => void;
}

export default function LocationFilterDropdown({
  selectedDistrict,
  setSelectedDistrict,
  statusFilter,
  setStatusFilter,
  onClose,
}: Readonly<LocationFilterDropdownProps>) {
  const hasActiveFilters = selectedDistrict !== 'all' || statusFilter !== 'all';

  return (
    <div className="absolute left-2.5 right-2.5 top-15 z-30 bg-surface border border-line rounded-2xl p-4 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <h3 className="mobile-h4 font-semibold text-ink">Filter Stores & Districts</h3>
        <button
          type="button"
          onClick={onClose}
          className="btn-icon-mobile text-ink-muted hover:text-ink -mr-2"
          aria-label="Close filters"
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <label className="mobile-overline text-ink-faint block mb-1.5">
          District
        </label>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="w-full form-input-mobile bg-canvas border border-line rounded-lg px-3 text-base text-ink font-normal focus:outline-none focus:border-taupe"
        >
          <option value="all">All Districts</option>
          {['Poblacion', 'Talomo', 'Buhangin', 'Agdao', 'Toril', 'Bunawan', 'Calinan', 'Tugbok'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mobile-overline text-ink-faint block mb-1.5">
          Store Status
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`touch-target-44 min-h-[44px] py-2 px-2 rounded-lg text-xs border text-center transition-colors ${
              statusFilter === 'all'
                ? 'bg-ink text-white border-ink font-semibold'
                : 'bg-canvas text-ink-body border-line hover:border-taupe font-normal'
            }`}
          >
            All Stores
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('online')}
            className={`touch-target-44 min-h-[44px] py-2 px-2 rounded-lg text-xs border flex items-center justify-center gap-1.5 transition-colors ${
              statusFilter === 'online'
                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                : 'bg-canvas text-ink-body border-line hover:border-emerald-600 font-normal'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block shrink-0 shadow-xs" />
            Open
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('offline')}
            className={`touch-target-44 min-h-[44px] py-2 px-2 rounded-lg text-xs border flex items-center justify-center gap-1.5 transition-colors ${
              statusFilter === 'offline'
                ? 'bg-rose-600 text-white border-rose-600 font-semibold shadow-xs'
                : 'bg-canvas text-ink-body border-line hover:border-rose-600 font-normal'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block shrink-0 shadow-xs" />
            Closed
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-end pt-1.5 text-xs text-ink-muted border-t border-line">
          <button
            type="button"
            onClick={() => {
              setSelectedDistrict('all');
              setStatusFilter('all');
            }}
            className="text-taupe font-semibold hover:underline py-1"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
