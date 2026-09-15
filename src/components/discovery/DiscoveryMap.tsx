'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

// Same inline SVG pin as BranchesMap.tsx/SingleBranchMap.tsx — kept
// identical for visual consistency across every Leaflet surface in the app.
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
      map.setView(points[0], 14);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

export interface DiscoveryMapBranch {
  shopSlug: string;
  shopName: string;
  branchId: number;
  branchName: string;
  address: string | null;
  city: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Discovery map — one pin per branch (not per shop), fed by GET /public/shops.
 * Adapted from BranchesMap.tsx (same pin/FitBounds/dynamic-import pattern,
 * already proven in this app) rather than a fresh Leaflet setup.
 */
export default function DiscoveryMap({ branches }: { readonly branches: DiscoveryMapBranch[] }) {
  if (branches.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
        No shops with map coordinates match these filters yet.
      </div>
    );
  }

  const points = branches.map((b) => [b.latitude, b.longitude] as [number, number]);

  return (
    <div className="rounded-2xl overflow-hidden border border-line" style={{ height: 520 }}>
      <MapContainer center={points[0]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds points={points} />
        {branches.map((b) => {
          const key = `${b.shopSlug}-${b.branchId}`;
          return (
            <Marker
              key={key}
              position={[b.latitude, b.longitude]}
              icon={pinIcon}
            >
              <Popup>
                <strong>{b.shopName}</strong>
                <br />
                {b.branchName !== b.shopName ? `${b.branchName} — ` : ''}
                {b.address}, {b.city}
                {b.landmark ? (
                  <>
                    <br />
                    <em>Landmark: {b.landmark}</em>
                  </>
                ) : null}
                <br />
                <Link href={`/shop/${b.shopSlug}`} className="text-[#9A8073] font-semibold">
                  View shop →
                </Link>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
