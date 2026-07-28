'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

export default function BranchesMap({ branches }: { readonly branches: ShopBranch[] }) {
  const pinned = branches
    .filter(b => b.latitude && b.longitude && !Number.isNaN(Number(b.latitude)) && !Number.isNaN(Number(b.longitude)))
    .map(b => ({ branch: b, pos: [Number(b.latitude), Number(b.longitude)] as [number, number] }));

  if (pinned.length === 0) {
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-10 text-center text-sm text-[#827A73]">
        No branches have map coordinates yet. Add a Latitude/Longitude to a branch to pin it here.
      </div>
    );
  }

  const points = pinned.map(p => p.pos);

  return (
    <div className="rounded-2xl overflow-hidden border border-[#EBE6E0]" style={{ height: 420 }}>
      <MapContainer center={points[0]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds points={points} />
        {pinned.map(({ branch, pos }) => (
          <Marker key={branch.id} position={pos} icon={pinIcon}>
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
  );
}
