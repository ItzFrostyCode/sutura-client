'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';

// Generic fallback pin — same inline store SVG used when a shop has no
// logo on file, kept visually close to BranchesMap.tsx's own pin so it
// doesn't look like a different, broken marker type.
const FALLBACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A8073" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20l-2 7H4L2 3Z"/><path d="M4 10v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/><path d="M9 13v4"/><path d="M15 13v4"/></svg>';

// One pin per branch, but the pin itself IS the shop's logo (a circular
// avatar with a pointer tail), not a generic teardrop — at multiple shops
// clustered close together on a real street grid, identical plain pins were
// unreadable; a recognizable logo lets a visitor tell shops apart at a
// glance the way real map apps (Google/Waze business pins) do. A gold ring
// + "MAIN" badge marks a shop's main branch versus a satellite branch.
export function buildStorePinIcon(logoPath: string | null, isMain: boolean, isOpen?: boolean): L.DivIcon {
  const ringColor = isMain ? '#9A8073' : '#EBE6E0';
  const statusColor = isOpen ? '#22c55e' : '#ef4444';
  const logoHtml = logoPath
    ? `<img src="${getMediaUrl(logoPath)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:#FAF6F3;">${FALLBACK_SVG}</span>`
    : `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;background:#FAF6F3;">${FALLBACK_SVG}</span>`;

  const html = `
    <div style="position:relative;width:40px;height:52px;">
      <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid ${ringColor};box-shadow:0 2px 6px rgba(45,42,38,0.35);background:#fff;">
        ${logoHtml}
      </div>
      <div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${ringColor};"></div>
      
      <!-- Online (Green) / Offline (Red) Indicator -->
      <span style="position:absolute;bottom:10px;right:-2px;width:12px;height:12px;border-radius:50%;background:${statusColor};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.35);z-index:10;" title="${isOpen ? 'Online (Open now)' : 'Offline (Closed now)'}"></span>

      ${isMain ? '<span style="position:absolute;top:-3px;right:-6px;background:#9A8073;color:#fff;font-size:8px;font-weight:700;letter-spacing:0.02em;padding:1.5px 4px;border-radius:6px;border:1.5px solid #fff;z-index:11;">MAIN</span>' : ''}
    </div>
  `;

  return L.divIcon({
    className: '',
    html,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -48],
  });
}

export const buildShopPinIcon = buildStorePinIcon;

// Distinct "you are here" marker — a solid pulsing dot, not another pin, so
// it never reads as just another shop branch on the map.
const userLocationIcon = L.divIcon({
  className: '',
  html: '<span style="position:relative;display:block;width:16px;height:16px;"><span style="position:absolute;inset:0;border-radius:9999px;background:#3B82F6;opacity:0.35;animation:sutura-pulse 1.8s ease-out infinite;"></span><span style="position:absolute;inset:3px;border-radius:9999px;background:#3B82F6;border:2px solid white;"></span></span><style>@keyframes sutura-pulse{0%{transform:scale(0.6);opacity:0.6;}100%{transform:scale(2.2);opacity:0;}}</style>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FitBounds({ points, disable }: { readonly points: [number, number][]; readonly disable?: boolean }) {
  const map = useMap();
  const prevKeyRef = useRef<string>('');
  const pointsKey = points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join('|');

  useEffect(() => {
    if (disable || !pointsKey) return;
    if (prevKeyRef.current === pointsKey) return;
    prevKeyRef.current = pointsKey;

    if (points.length === 1) {
      map.setView(points[0], 14);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points, pointsKey, disable]);
  return null;
}

function MapEventsHandler({
  onMoveEnd,
  mapRef,
  enabled,
}: {
  readonly onMoveEnd?: (lat: number, lng: number) => void;
  readonly mapRef?: React.MutableRefObject<LeafletMap | null>;
  readonly enabled?: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
      const timer = setTimeout(() => map.invalidateSize(), 150);
      return () => clearTimeout(timer);
    }
  }, [map, mapRef]);

  useMapEvents({
    moveend(e) {
      if (enabled && onMoveEnd) {
        const c = e.target.getCenter();
        onMoveEnd(c.lat, c.lng);
      }
    },
  });
  return null;
}

export interface DiscoveryMapBranch {
  shopSlug: string;
  shopName: string;
  shopLogoPath: string | null;
  branchId: number;
  branchName: string;
  isMain: boolean;
  address: string | null;
  city: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  isOpen?: boolean;
}

interface DiscoveryMapProps {
  readonly branches: DiscoveryMapBranch[];
  readonly userLocation?: { lat: number; lng: number } | null;
  readonly onSelectBranch?: (branch: DiscoveryMapBranch) => void;
  readonly fullScreen?: boolean;
  readonly selectable?: boolean;
  readonly onMoveEnd?: (lat: number, lng: number) => void;
  readonly mapRef?: React.MutableRefObject<LeafletMap | null>;
  readonly disableFitBounds?: boolean;
}

export default function DiscoveryMap({
  branches,
  userLocation,
  onSelectBranch,
  fullScreen,
  selectable,
  onMoveEnd,
  mapRef,
  disableFitBounds,
}: DiscoveryMapProps) {
  const gate = useGuestGatedHref();
  const hasNoResults = branches.length === 0 && !userLocation && !selectable;

  const points = useMemo(
    () => branches.map((b) => [b.latitude, b.longitude] as [number, number]),
    [branches]
  );
  const boundsPoints = useMemo(
    () => (userLocation ? [...points, [userLocation.lat, userLocation.lng] as [number, number]] : points),
    [points, userLocation]
  );
  const center = useMemo(
    () => boundsPoints[0] ?? [7.0731, 125.6128], // Davao City fallback
    [boundsPoints]
  );

  return (
    <div
      className={fullScreen ? 'absolute inset-0' : 'relative rounded-2xl overflow-hidden border border-line'}
      style={fullScreen ? undefined : { height: 520 }}
    >
      <MapContainer center={center} zoom={14} scrollWheelZoom zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEventsHandler onMoveEnd={onMoveEnd} mapRef={mapRef} enabled={selectable} />
        <FitBounds points={boundsPoints} disable={disableFitBounds} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {branches.map((b) => {
          const key = `${b.shopSlug}-${b.branchId}`;
          return (
            <Marker
              key={key}
              position={[b.latitude, b.longitude]}
              icon={buildStorePinIcon(b.shopLogoPath, b.isMain, b.isOpen)}
              eventHandlers={onSelectBranch ? { click: () => onSelectBranch(b) } : undefined}
            >
              {!onSelectBranch && (
                <Popup>
                  <strong>{b.shopName}</strong>
                  {' '}
                  <span style={{ fontSize: '11px', color: '#886E62', fontWeight: 700 }}>
                    {b.isMain ? '(Main Branch)' : `(${b.branchName})`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '3px 0', fontSize: '11px', fontWeight: 600, color: b.isOpen ? '#16a34a' : '#dc2626' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: b.isOpen ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                    {b.isOpen ? 'Open' : 'Closed'}
                  </div>
                  {b.address}, {b.city}
                  {b.landmark ? (
                    <>
                      <br />
                      <em>Landmark: {b.landmark}</em>
                    </>
                  ) : null}
                  <br />
                  <Link href={gate(`/shop/${b.shopSlug}`)} className="text-[#9A8073] font-semibold">
                    View store →
                  </Link>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {/* Central fixed pin in selectable / Choose on Map mode */}
      {selectable && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[500]">
          <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
            <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="#9A8073" stroke="#fff" strokeWidth="2" />
            <circle cx="15" cy="15" r="5" fill="#fff" />
          </svg>
        </div>
      )}

      {/* Overlaid on top of the still-visible map (centered on Davao City
          by default when there are no pins to fit bounds to) instead of
          replacing it outright — the map itself is still useful context
          even with zero results for the current filters. */}
      {hasNoResults && (
        <div className="absolute inset-x-0 bottom-4 z-[1000] flex justify-center px-4 pointer-events-none">
          <p className="bg-surface shadow-lg rounded-xl px-4 py-2.5 text-xs text-ink-muted text-center pointer-events-auto">
            No stores with map coordinates match these filters yet.
          </p>
        </div>
      )}
    </div>
  );
}
