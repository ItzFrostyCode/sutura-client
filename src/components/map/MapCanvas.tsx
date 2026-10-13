import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import ActiveNavigationPanel from './ActiveNavigationPanel';
import type { ActiveRoute } from './useDirections';

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
  selectedBranch: DiscoveryMapBranch | null;
  locationError: string;
  onDismissLocationError: () => void;
  route: ActiveRoute | null;
  routeLoading: boolean;
  onCancelRoute: () => void;
}

export default function MapCanvas({
  loading,
  filteredBranches,
  userLocation,
  onSelectBranch,
  isSelectMode,
  onMoveEnd,
  mapRef,
  selectedBranch,
  locationError,
  onDismissLocationError,
  route,
  routeLoading,
  onCancelRoute,
}: MapCanvasProps) {
  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
          Loading stores…
        </div>
      ) : (
        <DiscoveryMap
          fullScreen
          branches={filteredBranches}
          userLocation={userLocation ?? route?.origin ?? null}
          onSelectBranch={onSelectBranch}
          routePath={route?.path ?? null}
          cluster={!isSelectMode}
          selectedBranch={selectedBranch}
          selectable={isSelectMode}
          onMoveEnd={isSelectMode ? onMoveEnd : undefined}
          mapRef={mapRef}
          disableFitBounds={isSelectMode}
        />
      )}

      <ActiveNavigationPanel route={route} loading={routeLoading} onCancel={onCancelRoute} />

      {locationError && (
        <div role="alert" className="absolute top-3 left-1/2 -translate-x-1/2 w-[min(92%,26rem)] z-[1200] flex items-start gap-2 text-xs text-danger bg-surface shadow-lg rounded-xl px-3 py-2 border border-danger/20">
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
