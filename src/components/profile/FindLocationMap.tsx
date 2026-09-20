'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const FOCUSED_ZOOM = 17;
const OVERVIEW_ZOOM = 14;

export interface BranchPin {
  readonly id: number;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
}

// Drives the map's zoom from outside the MapContainer — react-leaflet's
// imperative map instance is only reachable via useMap() inside a child.
// No branch picked yet: overview that fits every pin. A branch picked (via
// the top dropdown, or tapping its own marker): close in on just that one.
function FlyToController({ branches, selectedId }: { readonly branches: readonly BranchPin[]; readonly selectedId: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (branches.length === 0) return;
    const selected = selectedId ? branches.find(b => b.id === selectedId) : null;
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], FOCUSED_ZOOM, { duration: 0.6 });
    } else if (branches.length === 1) {
      map.flyTo([branches[0].latitude, branches[0].longitude], OVERVIEW_ZOOM, { duration: 0.6 });
    } else {
      map.flyToBounds(branches.map(b => [b.latitude, b.longitude] as [number, number]), { padding: [50, 50], duration: 0.6 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, branches.length]);
  return null;
}

// Every time a fresh Locate result comes in: pull out to a wide view that
// fits every branch AND the shopper, then close back in on the shopper —
// so it's visibly "looking for you" before settling on your position,
// instead of a blue dot just silently appearing.
function LocateFlyController({ userPosition, branches }: { readonly userPosition: { lat: number; lng: number } | null; readonly branches: readonly BranchPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (!userPosition || branches.length === 0) return;
    const userLatLng: [number, number] = [userPosition.lat, userPosition.lng];
    const bounds: [number, number][] = [userLatLng, ...branches.map(b => [b.latitude, b.longitude] as [number, number])];
    map.flyToBounds(bounds, { padding: [60, 60], duration: 0.9 });
    const timer = setTimeout(() => {
      map.flyTo(userLatLng, FOCUSED_ZOOM, { duration: 0.9 });
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition]);
  return null;
}

interface FindLocationMapProps {
  /** Every branch with real coordinates — the map pins all of them, not
      just one; which one is "the" destination is a customer choice now. */
  readonly branches: readonly BranchPin[];
  readonly selectedBranchId: number | null;
  /** Fires when a branch's own marker is tapped directly on the map —
      mirrors picking it from the top dropdown. */
  readonly onSelectBranch?: (id: number) => void;
  /** The shopper's own live position, from the Find sheet's Locate button —
      rendered as a second, distinctly-colored marker once set. */
  readonly userPosition?: { lat: number; lng: number } | null;
  readonly className?: string;
  /** Only needed when the wrapper isn't already sized by className (e.g.
      w-full h-full inside an absolutely-positioned parent). */
  readonly height?: number;
}

// A lighter-weight sibling of SingleBranchMap for the "Find" sheet: plain
// round markers (one per branch) instead of a fixed pin + popup, and a
// selected marker reads as filled/larger versus the rest as outlined.
export default function FindLocationMap({ branches, selectedBranchId, onSelectBranch, userPosition, className, height }: Readonly<FindLocationMapProps>) {
  if (branches.length === 0) return null;
  const initialCenter: [number, number] = [branches[0].latitude, branches[0].longitude];

  return (
    <div className={className} style={height ? { height } : undefined}>
      {/* zoomControl off — Leaflet's default +/- sits top-left by default,
          the exact corner our own back button and branch pill occupy, so it
          collided with them. flyTo still drives zoom programmatically.
          scrollWheelZoom ON — with it off, a trackpad's two-finger
          scroll/pinch over the map isn't captured by Leaflet at all, so the
          gesture falls through and the BROWSER zooms the whole page instead
          of the map. (SingleBranchMap already had this on; only this map
          was left disabled.) */}
      <MapContainer center={initialCenter} zoom={OVERVIEW_ZOOM} scrollWheelZoom zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FlyToController branches={branches} selectedId={selectedBranchId} />
        <LocateFlyController userPosition={userPosition ?? null} branches={branches} />
        {branches.map(b => {
          const isSelected = selectedBranchId === b.id;
          return (
            <CircleMarker
              key={b.id}
              center={[b.latitude, b.longitude]}
              radius={isSelected ? 11 : 9}
              pathOptions={
                isSelected
                  ? { color: '#6B5647', weight: 3, fillColor: '#9A8073', fillOpacity: 1 }
                  : { color: '#9A8073', weight: 2, fillColor: '#FFFFFF', fillOpacity: 1 }
              }
              eventHandlers={onSelectBranch ? { click: () => onSelectBranch(b.id) } : undefined}
            />
          );
        })}
        {userPosition && (
          <CircleMarker
            center={[userPosition.lat, userPosition.lng]}
            radius={7}
            pathOptions={{ color: '#2563EB', weight: 2, fillColor: '#3B82F6', fillOpacity: 1 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
