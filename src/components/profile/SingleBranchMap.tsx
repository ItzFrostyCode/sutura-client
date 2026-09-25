'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from '@/lib/leafletSafe';
import 'leaflet/dist/leaflet.css';

// Stops any in-flight Leaflet animation before the map pane unmounts (e.g.
// a tab switch mid-zoom) — same fix as BranchesMap/DiscoveryMap/
// LocationPicker's MapController. This one has no fitBounds/flyTo of its
// own, but the initial render's internal transition is still an animation
// Leaflet can be mid-way through when React tears the pane down.
function StopOnUnmount() {
  const map = useMap();
  useEffect(() => {
    return () => {
      try {
        map.stop();
      } catch {
        // Safe fallback
      }
    };
  }, [map]);
  return null;
}

// Inline SVG avoids Leaflet's classic broken default-marker-image problem
// under bundlers without adding an external icon asset. stroke uses
// var(--brand-taupe) instead of a hardcoded hex — see BranchesMap.tsx's
// satellitePinIcon for the same reasoning.
const pinIcon = L.divIcon({
  className: '',
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="var(--brand-taupe)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
});

interface SingleBranchMapProps {
  readonly storeName: string;
  readonly branchName: string;
  readonly address: string;
  readonly city: string;
  readonly latitude: number;
  readonly longitude: number;
  /** Overrides the default rounded/bordered wrapper — e.g. an edge-to-edge,
      flush placement (no border/radius) instead of a card. */
  readonly className?: string;
  readonly height?: number;
}

export default function SingleBranchMap({ storeName, branchName, address, city, latitude, longitude, className, height = 360 }: Readonly<SingleBranchMapProps>) {
  const pos: [number, number] = [latitude, longitude];

  return (
    <div className={className ?? 'rounded-2xl overflow-hidden border border-line'} style={{ height }}>
      <MapContainer center={pos} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <StopOnUnmount />
        <Marker position={pos} icon={pinIcon}>
          <Popup>
            <strong>{storeName} — {branchName}</strong>
            <br />
            {address}, {city}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
