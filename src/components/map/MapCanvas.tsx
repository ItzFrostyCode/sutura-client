import dynamic from 'next/dynamic';
import { LocateFixed, X } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';

const DiscoveryMap = dynamic(() => import('@/components/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
      Loading map…
    </div>
  ),
});

interface MapCanvasProps {
  loading: boolean;
  filteredBranches: DiscoveryMapBranch[];
  userLocation: { lat: number; lng: number } | null;
  onSelectBranch: (b: DiscoveryMapBranch | null) => void;
  isSelectMode: boolean;
  onMoveEnd: (lat: number, lng: number) => void;
  mapRef: React.MutableRefObject<LeafletMap | null>;
  onNearMe: () => void;
  locating: boolean;
  locationError: string;
  onDismissLocationError: () => void;
}

export default function MapCanvas({
  loading,
  filteredBranches,
  userLocation,
  onSelectBranch,
  isSelectMode,
  onMoveEnd,
  mapRef,
  onNearMe,
  locating,
  locationError,
  onDismissLocationError,
}: MapCanvasProps) {
  return (
    <div className="flex-1 relative overflow-hidden z-0">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
          Loading stores…
        </div>
      ) : (
        <DiscoveryMap
          fullScreen
          branches={filteredBranches}
          userLocation={userLocation}
          onSelectBranch={onSelectBranch}
          selectable={isSelectMode}
          onMoveEnd={isSelectMode ? onMoveEnd : undefined}
          mapRef={mapRef}
          disableFitBounds={isSelectMode}
        />
      )}

      {/* GPS Quick Button on bottom-right of map */}
      <button
        type="button"
        onClick={onNearMe}
        disabled={locating}
        className="absolute bottom-3 right-3 z-[400] w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center text-taupe shadow-md hover:bg-sunken disabled:opacity-60 cursor-pointer"
        aria-label="Use my current location"
      >
        <LocateFixed size={18} className={locating ? 'animate-pulse' : ''} />
      </button>

      {locationError && (
        <div className="absolute top-2 left-2 right-2 z-[1000] flex items-start gap-2 text-xs text-danger bg-surface shadow-lg rounded-xl px-3 py-2 border border-danger/20">
          <span className="flex-1">{locationError}</span>
          <button
            type="button"
            onClick={onDismissLocationError}
            aria-label="Dismiss"
            className="cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
