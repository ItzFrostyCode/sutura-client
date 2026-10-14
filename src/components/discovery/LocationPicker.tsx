'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import '@/lib/leafletSafe';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import type { SavedLocation } from '@/lib/customerLocation';
import LocationPickerHeader from './location-picker/LocationPickerHeader';
import LocationPickerFooter from './location-picker/LocationPickerFooter';
import { useLocationPickerState } from './location-picker/useLocationPickerState';

const zoomButton = 'flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_12px_rgba(45,42,38,0.18)] transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-60';

function MapRefSetter({ mapRef }: { readonly mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => {
      clearTimeout(timer);
      try {
        map.stop();
      } catch {
        // Safe fallback
      }
    };
  }, [map, mapRef]);
  return null;
}

function MapCenterTracker({ onMoveEnd }: { readonly onMoveEnd: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onMoveEnd(c.lat, c.lng);
    },
  });
  return null;
}

interface LocationPickerProps {
  readonly initial: SavedLocation | null;
  readonly onClose: () => void;
  readonly onConfirm: (loc: SavedLocation) => void;
  readonly confirmLabel?: string;
}

export default function LocationPicker({
  initial,
  onClose,
  onConfirm,
  confirmLabel = 'Choose this Location',
}: Readonly<LocationPickerProps>) {
  const state = useLocationPickerState(initial, onConfirm);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center">
      <button
        type="button"
        aria-label="Close location picker"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default border-none p-0 focus:outline-none"
      />

      <div className="relative w-full max-w-[599px] h-full bg-canvas flex flex-col shadow-2xl border-x border-line z-10">
        <LocationPickerHeader
          query={state.query}
          setQuery={state.setQuery}
          searching={state.searching}
          onSearchSubmit={() => void state.handleSearchSubmit()}
          onClose={onClose}
          suggestionsVisible={state.suggestionsVisible}
          searchResults={state.searchResults}
          recents={state.recents}
          onPickSearchResult={state.handlePickSearchResult}
          onPickRecent={state.handlePickRecent}
          onInputFocus={state.handleInputFocus}
          onInputBlur={state.handleInputBlur}
        />

        <div className="flex-1 min-h-0 relative">
          <MapContainer center={state.position} zoom={16} className="w-full h-full" zoomControl={false} scrollWheelZoom="center" touchZoom="center" doubleClickZoom="center">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRefSetter mapRef={state.mapRef} />
            <MapCenterTracker onMoveEnd={state.handleMapMoveEnd} />

          </MapContainer>

          {/* Center pin */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[500]">
            <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
              <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="#2D2A26" stroke="#fff" strokeWidth="2" />
              <circle cx="15" cy="15" r="5" fill="#fff" />
            </svg>
          </div>

          {/* My location, zoom in, zoom out — zooming goes around the pin */}
          <div role="group" aria-label="Map controls" className="absolute bottom-3 right-3 z-[400] flex flex-col gap-2">
            <button type="button" onClick={state.handleUseCurrentLocation} disabled={state.locating} className={zoomButton} aria-label="Use my current location">
              <LocateFixed size={20} className={state.locating ? 'animate-pulse' : ''} />
            </button>
            <button type="button" onClick={() => state.mapRef.current?.zoomIn()} className={zoomButton} aria-label="Zoom in"><Plus size={20} /></button>
            <button type="button" onClick={() => state.mapRef.current?.zoomOut()} className={zoomButton} aria-label="Zoom out"><Minus size={20} /></button>
          </div>
        </div>

        <LocationPickerFooter
          error={state.error}
          reverseLoading={state.reverseLoading}
          address={state.address}
          confirmLabel={confirmLabel}
          onConfirm={state.handleConfirm}
        />
      </div>
    </div>
  );
}
