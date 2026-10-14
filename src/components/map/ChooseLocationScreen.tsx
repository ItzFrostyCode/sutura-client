'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import LocationRow from '@/components/location/LocationRow';
import ChooseSearchBar from './ChooseSearchBar';
import ChooseConfirmCard from './ChooseConfirmCard';
import { DAVAO_CENTER, useChooseLocation } from './useChooseLocation';

const DiscoveryMap = dynamic(() => import('@/components/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">Loading map…</div>,
});

/** Choose a place on the map: the map and a pin in its middle, a search bar above, and the address with one button below. No shops. */
export default function ChooseLocationScreen() {
  const c = useChooseLocation();

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-canvas">
      {c.start !== undefined && (
        <DiscoveryMap
          fullScreen
          branches={[]}
          userLocation={c.userLocation}
          selectable
          onMoveEnd={c.handleMapMoveEnd}
          mapRef={c.mapRef}
          disableFitBounds
          initialView={c.start ?? { lat: DAVAO_CENTER.lat, lng: DAVAO_CENTER.lng, zoom: 13 }}
        />
      )}

      <div className="pointer-events-none absolute inset-x-4 top-4 z-[1000] mx-auto flex max-w-[560px] flex-col gap-2" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="pointer-events-auto">
          <ChooseSearchBar query={c.query} setQuery={c.setQuery} searching={c.searching} onBack={c.goBack} onSubmit={() => void c.submitSearch()} onClear={c.clearSearch} />
        </div>

        {c.results.length > 0 && (
          <div className="card-soft pointer-events-auto p-2">
            {c.results.map((place, i) => (
              <LocationRow key={`${place.lat}-${place.lng}-${i}`} icon={<MapPin size={20} />} title={place.display_name.split(',')[0]} subtitle={place.display_name} onClick={() => c.pickResult(place)} />
            ))}
          </div>
        )}

        {c.error && <p className="mobile-body-sm pointer-events-auto rounded-2xl bg-surface px-4 py-3 text-danger shadow-[0_2px_12px_rgba(45,42,38,0.12)]">{c.error}</p>}
      </div>

      <div className="absolute inset-x-4 bottom-4 z-[1000] mx-auto max-w-[560px]">
        <ChooseConfirmCard address={c.address} reverseLoading={c.reverseLoading} locating={c.locating} onLocate={c.locate} onZoomIn={c.zoomIn} onZoomOut={c.zoomOut} onConfirm={c.confirm} />
      </div>
    </div>
  );
}
