'use client';

import { Suspense, useState } from 'react';
import { useMapPage } from '@/components/map/useMapPage';
import MapCanvas from '@/components/map/MapCanvas';
import MapControls from '@/components/map/MapControls';
import MapExplorePanel from '@/components/map/MapExplorePanel';
import { useDirections } from '@/components/map/useDirections';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import FeatureNav from '@/components/shared/FeatureNav';

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-sm text-ink-muted">
          Loading map…
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}

/**
 * Tailor Locator: a full-screen map with clustered shop pins, a floating
 * explore panel (search · Open · filters · shop list) on the left — a bottom
 * sheet on phones — and round locate / zoom controls on the right.
 */
function MapPageContent() {
  const m = useMapPage();
  const directions = useDirections();
  const showDirections = (branch: DiscoveryMapBranch) => directions.start(branch, m.userLocation);
  // Hovered in the shop list → its pin bounces (and leaves its cluster).
  const [hoveredBranch, setHoveredBranch] = useState<DiscoveryMapBranch | null>(null);

  return (
    // Feature bar fixed at the bottom, except while picking a location.
    // The map area fills the screen above it.
    <div className="flex h-[calc(100dvh-var(--fnav-h))] w-full flex-col bg-canvas">
      {!m.isSelectMode && <FeatureNav />}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <MapCanvas
          loading={m.loading}
          filteredBranches={m.filteredBranches}
          userLocation={m.userLocation}
          onSelectBranch={m.handleSelectBranch}
          isSelectMode={m.isSelectMode}
          onMoveEnd={m.handleMapMoveEnd}
          mapRef={m.mapRef as unknown as React.MutableRefObject<any>}
          selectedBranch={m.selectedBranch}
          highlightedBranch={hoveredBranch}
          locationError={m.locationError || directions.error}
          onDismissLocationError={() => { m.setLocationError(''); directions.dismissError(); }}
          route={directions.route}
          routeLoading={directions.loading}
          onCancelRoute={directions.cancel}
        />

        <MapExplorePanel
          isSelectMode={m.isSelectMode}
          onBack={m.handleBack}
          q={m.q}
          onQueryChange={m.setQ}
          onSubmitSearch={() => void m.handleSearchSubmit()}
          openOnly={m.statusFilter === 'online'}
          onToggleOpenOnly={() => m.setStatusFilter(m.statusFilter === 'online' ? 'all' : 'online')}
          district={m.district}
          onDistrictChange={m.setDistrict}
          userLocation={m.userLocation}
          locating={m.locating}
          onNearMe={m.handleNearMe}
          hasActiveFilters={m.hasActiveFilters}
          onResetFilters={m.handleResetFilters}
          branches={m.filteredBranches}
          loading={m.loading}
          selectedBranch={m.selectedBranch}
          onSelectBranch={m.handleSelectBranch}
          onHoverBranch={setHoveredBranch}
          onConfirmLocation={m.handleConfirmPickedLocation}
          onDirections={showDirections}
          pickedAddress={m.pickedAddress}
          reverseLoading={m.reverseLoading}
        />

        <MapControls mapRef={m.mapRef} onLocate={m.handleNearMe} locating={m.locating} located={!!m.userLocation} />
      </div>
    </div>
  );
}
