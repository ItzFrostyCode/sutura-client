'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { ShopBranch } from './branchHelpers';

// Inline SVG avoids Leaflet's classic broken default-marker-image problem
// under bundlers without adding an external icon asset.
const pinIcon = L.divIcon({
  className: '',
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="#9A8073" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -22],
});

function FitBounds({ points }: { readonly points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

// Flies the map to whichever branch is selected from the side list — the
// Grab/Foodpanda "tap a card, the map jumps to it" pattern, scoped to just
// this map view since Branches keeps Cards/Map as separate tabs rather than
// a permanent split layout.
function FlyToSelected({ pos }: { readonly pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 16, { duration: 0.8 });
  }, [map, pos]);
  return null;
}

export default function BranchesMap({ branches }: { readonly branches: ShopBranch[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const markerRefs = useRef(new Map<number, L.Marker>());

  const pinned = branches
    .filter(b => b.latitude && b.longitude && !Number.isNaN(Number(b.latitude)) && !Number.isNaN(Number(b.longitude)))
    .map(b => ({ branch: b, pos: [Number(b.latitude), Number(b.longitude)] as [number, number] }));

  if (pinned.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
        No branches have map coordinates yet. Add a Latitude/Longitude to a branch to pin it here.
      </div>
    );
  }

  const points = pinned.map(p => p.pos);
  const selectedPos = pinned.find(p => p.branch.id === selectedId)?.pos ?? null;

  const handleSelect = (id: number) => {
    setSelectedId(id);
    markerRefs.current.get(id)?.openPopup();
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-line flex flex-col md:flex-row" style={{ height: 420 }}>
      <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-line bg-white overflow-y-auto max-h-32 md:max-h-none">
        {pinned.map(({ branch }) => (
          <button
            key={branch.id}
            type="button"
            onClick={() => handleSelect(branch.id)}
            className={`w-full text-left px-4 py-3 flex items-start gap-2.5 border-b border-line last:border-b-0 transition-colors ${
              selectedId === branch.id ? 'bg-sunken' : 'hover:bg-canvas'
            }`}
          >
            <MapPin size={14} className={`mt-0.5 shrink-0 ${selectedId === branch.id ? 'text-taupe' : 'text-ink-faint'}`} />
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${selectedId === branch.id ? 'text-taupe' : 'text-ink'}`}>
                {branch.name}
              </p>
              <p className="text-xs text-ink-muted truncate">{branch.city}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <MapContainer center={points[0]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FitBounds points={points} />
          <FlyToSelected pos={selectedPos} />
          {pinned.map(({ branch, pos }) => (
            <Marker
              key={branch.id}
              position={pos}
              icon={pinIcon}
              ref={(ref) => {
                if (ref) markerRefs.current.set(branch.id, ref);
                else markerRefs.current.delete(branch.id);
              }}
              eventHandlers={{ click: () => setSelectedId(branch.id) }}
            >
              <Popup>
                <strong>{branch.name}</strong>
                <br />
                {branch.address}, {branch.city}
                {branch.landmark ? (
                  <>
                    <br />
                    <em>Landmark: {branch.landmark}</em>
                  </>
                ) : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
