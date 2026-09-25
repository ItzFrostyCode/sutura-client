import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { SavedLocation } from '@/lib/customerLocation';
import MapSidebarFilters from './MapSidebarFilters';
import MapSidebarSelectedStore from './MapSidebarSelectedStore';
import MapSidebarStoreList from './MapSidebarStoreList';
import { Check } from 'lucide-react';

interface MapRightSidebarProps {
  district: string;
  onDistrictChange: (dist: string) => void;
  statusFilter: 'all' | 'online' | 'offline';
  onStatusFilterChange: (status: 'all' | 'online' | 'offline') => void;
  userLocation: { lat: number; lng: number } | null;
  locating: boolean;
  onNearMe: () => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  branches: DiscoveryMapBranch[];
  selectedBranch: DiscoveryMapBranch | null;
  onSelectBranch: (b: DiscoveryMapBranch | null) => void;
  loading: boolean;
  isSelectMode: boolean;
  onConfirmLocation: (loc?: SavedLocation) => void;
  pickedAddress?: string;
  reverseLoading?: boolean;
}

export default function MapRightSidebar({
  district,
  onDistrictChange,
  statusFilter,
  onStatusFilterChange,
  userLocation,
  locating,
  onNearMe,
  hasActiveFilters,
  onResetFilters,
  branches,
  selectedBranch,
  onSelectBranch,
  loading,
  isSelectMode,
  onConfirmLocation,
  pickedAddress,
  reverseLoading,
}: MapRightSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-[340px] lg:w-[380px] xl:w-[400px] border-l border-line bg-canvas h-full shrink-0 overflow-hidden shadow-xs z-10">
      {selectedBranch ? (
        <MapSidebarSelectedStore
          branch={selectedBranch}
          onClose={() => onSelectBranch(null)}
          isSelectMode={isSelectMode}
          userLocation={userLocation}
          onConfirmLocation={onConfirmLocation}
        />
      ) : (
        <>
          <MapSidebarFilters
            district={district}
            onDistrictChange={onDistrictChange}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            userLocation={userLocation}
            locating={locating}
            onNearMe={onNearMe}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={onResetFilters}
          />

          <MapSidebarStoreList
            branches={branches}
            selectedBranch={selectedBranch}
            onSelectBranch={onSelectBranch}
            loading={loading}
          />

          {isSelectMode && (
            <div className="p-3 border-t border-line bg-surface/70 space-y-2 shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                Pinned Address
              </p>
              <p className="text-xs text-ink font-medium leading-snug line-clamp-2">
                {reverseLoading
                  ? 'Locating address…'
                  : pickedAddress || 'Move map or click a store to select'}
              </p>
              <button
                type="button"
                onClick={() => onConfirmLocation()}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-taupe text-white text-xs font-semibold hover:bg-taupe-hover transition-colors shadow-xs cursor-pointer"
              >
                <Check size={14} /> Choose Map Location
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
