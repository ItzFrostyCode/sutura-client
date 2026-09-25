'use client';

import { Suspense, useState } from 'react';
import { useMapPage } from '@/components/map/useMapPage';
import MapHeaderBar from '@/components/map/MapHeaderBar';
import MapFilterDropdown from '@/components/map/MapFilterDropdown';
import MapCanvas from '@/components/map/MapCanvas';
import SelectedBranchCard from '@/components/map/SelectedBranchCard';
import MapSelectFooter from '@/components/map/MapSelectFooter';
import MapRightSidebar from '@/components/map/MapRightSidebar';

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

function MapPageContent() {
  const {
    isSelectMode,
    mapRef,
    handleBack,
    q,
    setQ,
    district,
    setDistrict,
    statusFilter,
    setStatusFilter,
    showFilterDropdown,
    setShowFilterDropdown,
    filteredBranches,
    hasActiveFilters,
    loading,
    selectedBranch,
    setSelectedBranch,
    userLocation,
    locating,
    locationError,
    setLocationError,
    pickedAddress,
    reverseLoading,
    handleMapMoveEnd,
    handleSearchSubmit,
    handleNearMe,
    handleSelectBranch,
    handleResetFilters,
    handleConfirmPickedLocation,
  } = useMapPage();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-canvas relative">
      <MapHeaderBar
        onBack={handleBack}
        q={q}
        onQueryChange={setQ}
        onSubmitSearch={() => void handleSearchSubmit()}
        isSelectMode={isSelectMode}
        hasActiveFilters={hasActiveFilters}
        onToggleFilter={() => setShowFilterDropdown((prev) => !prev)}
        storeCount={filteredBranches.length}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <MapCanvas
          loading={loading}
          filteredBranches={filteredBranches}
          userLocation={userLocation}
          onSelectBranch={handleSelectBranch}
          isSelectMode={isSelectMode}
          onMoveEnd={handleMapMoveEnd}
          mapRef={mapRef as unknown as React.MutableRefObject<any>}
          onNearMe={handleNearMe}
          locating={locating}
          locationError={locationError}
          onDismissLocationError={() => setLocationError('')}
        />

        {isSidebarOpen && (
          <MapRightSidebar
            district={district}
            onDistrictChange={setDistrict}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            userLocation={userLocation}
            locating={locating}
            onNearMe={handleNearMe}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            branches={filteredBranches}
            selectedBranch={selectedBranch}
            onSelectBranch={handleSelectBranch}
            loading={loading}
            isSelectMode={isSelectMode}
            onConfirmLocation={handleConfirmPickedLocation}
            pickedAddress={pickedAddress}
            reverseLoading={reverseLoading}
          />
        )}
      </div>

      <MapFilterDropdown
        isOpen={showFilterDropdown}
        onClose={() => setShowFilterDropdown(false)}
        district={district}
        onDistrictChange={setDistrict}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        userLocation={userLocation}
        locating={locating}
        onNearMe={handleNearMe}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      <SelectedBranchCard
        branch={selectedBranch}
        onClose={() => setSelectedBranch(null)}
        isSelectMode={isSelectMode}
        userLocation={userLocation}
        onConfirmLocation={handleConfirmPickedLocation}
      />

      <MapSelectFooter
        isSelectMode={isSelectMode}
        hasSelectedBranch={!!selectedBranch}
        reverseLoading={reverseLoading}
        pickedAddress={pickedAddress}
        onConfirmPickedLocation={() => handleConfirmPickedLocation()}
      />
    </div>
  );
}
