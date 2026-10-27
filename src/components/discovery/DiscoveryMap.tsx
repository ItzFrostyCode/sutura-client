'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import RouteLayer from '@/components/map/RouteLayer';
import type { Map as LeafletMap } from 'leaflet';
import L from '@/lib/leafletSafe';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';

// Generic fallback pin — same inline store SVG used when a store has no
// logo on file, kept visually close to BranchesMap.tsx's own pin so it
// doesn't look like a different, broken marker type.
const FALLBACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D2A26" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20l-2 7H4L2 3Z"/><path d="M4 10v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/><path d="M9 13v4"/><path d="M15 13v4"/></svg>';

// One pin per branch, but the pin itself IS the store's logo (a circular
// avatar with a pointer tail), not a generic teardrop — at multiple stores
// clustered close together on a real street grid, identical plain pins were
// unreadable; a recognizable logo lets a visitor tell stores apart at a
// glance the way real map apps (Google/Waze business pins) do. A crisp dark ring
// + "MAIN" badge marks a store's main branch versus a satellite branch.
// `selected` (Find a Branch's chosen branch): taupe ring, drawn a size up.
// Main store vs branch, told apart at a glance: main = larger pin with a
// deep-brown ring and a solid MAIN tag; branch = standard pin with a taupe
// ring and a light BRANCH tag. `bounce` plays a one-shot hop (pin-bounce in
// globals.css) when the icon mounts — used for the hovered/selected pin.
const PIN_THEME = {
  main: { size: 42, ring: '#2E1C14', tagBg: '#2E1C14', tagFg: '#FFFFFF', tagBorder: '#FFFFFF', tag: 'MAIN' },
  branch: { size: 36, ring: '#8D7B68', tagBg: '#F3EEE8', tagFg: '#5E4E40', tagBorder: '#8D7B68', tag: 'BRANCH' },
} as const;

export function buildStorePinIcon(logoPath: string | null, isMain: boolean, isOpen?: boolean, selected = false, bounce = false): L.DivIcon {
  const t = PIN_THEME[isMain ? 'main' : 'branch'];
  const tail = 11;
  const h = t.size + tail;
  const statusColor = isOpen ? '#22c55e' : '#ef4444';
  const logoHtml = logoPath
    ? `<img src="${getMediaUrl(logoPath)}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:#FAF6F3;">${FALLBACK_SVG}</span>`
    : `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;background:#FAF6F3;">${FALLBACK_SVG}</span>`;
  // Selected: a white gap then a second ring in the pin's own colour.
  const shadow = selected
    ? `0 0 0 2px #fff,0 0 0 4px ${t.ring},0 4px 12px rgba(45,42,38,0.45)`
    : '0 2px 6px rgba(45,42,38,0.45)';

  const html = `
    <div class="${bounce ? 'pin-bounce' : ''}" style="position:relative;width:${t.size}px;height:${h}px;">
      <div style="position:relative;width:100%;height:100%;transform-origin:50% 100%;transform:scale(${selected ? 1.15 : 1});">
        <div style="width:${t.size}px;height:${t.size}px;border-radius:50%;overflow:hidden;border:3px solid ${t.ring};box-shadow:${shadow};background:#fff;">
          ${logoHtml}
        </div>
        <div style="position:absolute;bottom:1px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:${tail - 1}px solid ${t.ring};"></div>
        <span style="position:absolute;bottom:${tail}px;right:-2px;width:12px;height:12px;border-radius:50%;background:${statusColor};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.35);z-index:10;" title="${isOpen ? 'Open now' : 'Closed now'}"></span>
        <span style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);white-space:nowrap;background:${t.tagBg};color:${t.tagFg};font:700 8px/1 var(--font-outfit),system-ui,sans-serif;letter-spacing:0.06em;padding:3px 5px;border-radius:9999px;border:1.5px solid ${t.tagBorder};box-shadow:0 1px 3px rgba(0,0,0,0.25);z-index:11;">${t.tag}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: '',
    html,
    iconSize: [t.size, h],
    iconAnchor: [t.size / 2, h],
    popupAnchor: [0, -h + 4],
  });
}

// "You are here": pulsing ring, solid blue dot, and a dark label pinned
// above it (styles: .you-marker in globals.css). The 48px box is anchored at
// its centre, so the dot sits exactly on the position at every zoom.
const YOU_PIN_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
export const userLocationIcon = L.divIcon({
  className: '',
  html: `<div class="you-marker" role="img" aria-label="You are here"><span class="you-marker__ring"></span><span class="you-marker__dot"></span><span class="you-marker__label">${YOU_PIN_SVG}You are here</span></div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

/** Above every shop pin, including the selected one (1000). */
export const USER_MARKER_Z = 2000;

// Navigation arrow (lucide "navigation"), filled — distinct from /map's target-icon near-me toggle.
const LOCATE_SVG = '<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';

/** Leaflet control (top-right) that flies the map back to the visitor. */
export function RecenterControl({ position }: { readonly position: { lat: number; lng: number } }) {
  const map = useMap();
  const posRef = useRef(position);
  useEffect(() => { posRef.current = position; }, [position]);

  useEffect(() => {
    const Control = L.Control.extend({
      onAdd() {
        const btn = L.DomUtil.create('button', 'recenter-control');
        btn.type = 'button';
        btn.title = 'Back to my location';
        btn.setAttribute('aria-label', 'Back to my location');
        btn.innerHTML = LOCATE_SVG;
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, 'click', () => map.flyTo([posRef.current.lat, posRef.current.lng], 15, { duration: 0.8 }));
        return btn;
      },
    });
    const control = new Control({ position: 'topright' });
    control.addTo(map);
    return () => { control.remove(); };
  }, [map]);

  return null;
}

function FitBounds({ points, disable }: { readonly points: [number, number][]; readonly disable?: boolean }) {
  const map = useMap();
  const prevKeyRef = useRef<string>('');
  const pointsKey = points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join('|');

  useEffect(() => {
    return () => {
      try {
        map.stop();
      } catch {
        // Safe fallback
      }
    };
  }, [map]);

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

// Count bubble for a group of nearby branches (Tailor Locator clustering).
function buildClusterIcon(count: number): L.DivIcon {
  const size = count < 5 ? 40 : count < 20 ? 46 : 54;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#6B4E3E;border:3px solid #fff;box-shadow:0 3px 10px rgba(45,42,38,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${count < 100 ? 15 : 13}px;font-family:inherit;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const CLUSTER_CELL_PX = 64;
const CLUSTER_UNTIL_ZOOM = 17;

/**
 * Groups branches that sit within one ~64px screen cell at the current zoom
 * into a numbered bubble; tapping a bubble zooms in until they split. The
 * selected branch is never folded into a bubble. Zoom 17+ shows every pin.
 */
function ClusteredBranchMarkers({ branches, selectedKey, highlightKey, onSelect }: {
  readonly branches: DiscoveryMapBranch[];
  readonly selectedKey: string | null;
  /** Hovered in the side list: pulled out of its bubble and bounced. */
  readonly highlightKey: string | null;
  readonly onSelect: (branch: DiscoveryMapBranch) => void;
}) {
  const map = useMap();
  const [viewTick, setViewTick] = useState(0);
  useMapEvents({ zoomend: () => setViewTick((t) => t + 1), moveend: () => setViewTick((t) => t + 1) });

  const groups = useMemo(() => {
    const zoom = map.getZoom();
    const free = branches.filter((b) => {
      const key = `${b.storeSlug}-${b.branchId}`;
      return key !== selectedKey && key !== highlightKey;
    });
    if (zoom >= CLUSTER_UNTIL_ZOOM) return free.map((b) => [b]);
    const cells = new Map<string, DiscoveryMapBranch[]>();
    free.forEach((b) => {
      const p = map.project([b.latitude, b.longitude], zoom);
      const key = `${Math.floor(p.x / CLUSTER_CELL_PX)}:${Math.floor(p.y / CLUSTER_CELL_PX)}`;
      cells.set(key, [...(cells.get(key) ?? []), b]);
    });
    return [...cells.values()];
    // viewTick re-runs this on every zoom/pan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, selectedKey, highlightKey, map, viewTick]);

  const selected = branches.find((b) => `${b.storeSlug}-${b.branchId}` === selectedKey) ?? null;
  const highlighted = highlightKey && highlightKey !== selectedKey
    ? branches.find((b) => `${b.storeSlug}-${b.branchId}` === highlightKey) ?? null
    : null;
  // Built once per pin, not per pan/zoom re-render, so the bounce plays once.
  const selectedIcon = useMemo(
    () => (selected ? buildStorePinIcon(selected.storeLogoPath, selected.isMain, selected.isOpen, true, true) : null),
    [selected],
  );
  const highlightedIcon = useMemo(
    () => (highlighted ? buildStorePinIcon(highlighted.storeLogoPath, highlighted.isMain, highlighted.isOpen, false, true) : null),
    [highlighted],
  );

  return (
    <>
      {groups.map((group) => {
        if (group.length === 1) {
          const b = group[0];
          return (
            <Marker
              key={`${b.storeSlug}-${b.branchId}`}
              position={[b.latitude, b.longitude]}
              icon={buildStorePinIcon(b.storeLogoPath, b.isMain, b.isOpen)}
              title={b.storeName}
              eventHandlers={{ click: () => onSelect(b) }}
            />
          );
        }
        const lat = group.reduce((s, b) => s + b.latitude, 0) / group.length;
        const lng = group.reduce((s, b) => s + b.longitude, 0) / group.length;
        const bounds = L.latLngBounds(group.map((b) => [b.latitude, b.longitude] as [number, number]));
        return (
          <Marker
            key={`cluster-${group.map((b) => b.branchId).join('-')}`}
            position={[lat, lng]}
            icon={buildClusterIcon(group.length)}
            title={`${group.length} shops here — tap to zoom in`}
            eventHandlers={{
              click: () => {
                // All at one spot (same building): jump straight to street level.
                if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.setView([lat, lng], CLUSTER_UNTIL_ZOOM + 1);
                else map.fitBounds(bounds, { padding: [80, 80], maxZoom: CLUSTER_UNTIL_ZOOM + 1 });
              },
            }}
          />
        );
      })}
      {highlighted && highlightedIcon && (
        <Marker
          position={[highlighted.latitude, highlighted.longitude]}
          zIndexOffset={900}
          icon={highlightedIcon}
          title={highlighted.storeName}
          eventHandlers={{ click: () => onSelect(highlighted) }}
        />
      )}
      {selected && selectedIcon && (
        <Marker
          position={[selected.latitude, selected.longitude]}
          zIndexOffset={1000}
          icon={selectedIcon}
          title={selected.storeName}
          eventHandlers={{ click: () => onSelect(selected) }}
        />
      )}
    </>
  );
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

  // Auto-resize when container changes (e.g. sidebar toggle or window resize)
  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

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
  storeSlug: string;
  storeName: string;
  storeLogoPath: string | null;
  branchId: number;
  branchName: string;
  isMain: boolean;
  address: string | null;
  city: string | null;
  district?: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  isOpen?: boolean;
  /** Tailor Locator list cards: photo, rating, specialties, distance. */
  storeBannerPath?: string | null;
  rating?: number | null;
  reviewsCount?: number;
  specializations?: string[];
  distanceKm?: number | null;
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
  /** Active directions route as [lat, lng] points; null when not navigating. */
  readonly routePath?: [number, number][] | null;
  /** Group nearby pins into numbered bubbles (Tailor Locator). Needs onSelectBranch. */
  readonly cluster?: boolean;
  /** Drawn larger with a double ring, bounced, and never clustered. */
  readonly selectedBranch?: DiscoveryMapBranch | null;
  /** Hovered in a side list: bounced and pulled out of its cluster. */
  readonly highlightedBranch?: DiscoveryMapBranch | null;
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
  routePath,
  cluster = false,
  selectedBranch = null,
  highlightedBranch = null,
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
        {/* While a route is shown it owns the viewport; fitting to every pin would yank it away. */}
        <FitBounds points={boundsPoints} disable={disableFitBounds || !!routePath} />
        {routePath && <RouteLayer path={routePath} />}
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} zIndexOffset={USER_MARKER_Z} keyboard={false} />
            {!routePath && <RecenterControl position={userLocation} />}
          </>
        )}
        {cluster && onSelectBranch && (
          <ClusteredBranchMarkers
            branches={branches}
            selectedKey={selectedBranch ? `${selectedBranch.storeSlug}-${selectedBranch.branchId}` : null}
            highlightKey={highlightedBranch ? `${highlightedBranch.storeSlug}-${highlightedBranch.branchId}` : null}
            onSelect={onSelectBranch}
          />
        )}
        {!(cluster && onSelectBranch) && branches.map((b) => {
          const key = `${b.storeSlug}-${b.branchId}`;
          return (
            <Marker
              key={key}
              position={[b.latitude, b.longitude]}
              icon={buildStorePinIcon(b.storeLogoPath, b.isMain, b.isOpen)}
              eventHandlers={onSelectBranch ? { click: () => onSelectBranch(b) } : undefined}
            >
              {!onSelectBranch && (
                <Popup>
                  <strong>{b.storeName}</strong>
                  {' '}
                  <span style={{ fontSize: '11px', color: '#2D2A26', fontWeight: 700 }}>
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
                  <Link href={gate(`/store/${b.storeSlug}`)} className="text-ink font-bold hover:underline">
                    View shop →
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
            <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="#2D2A26" stroke="#fff" strokeWidth="2" />
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
            No shops with map coordinates match these filters yet.
          </p>
        </div>
      )}
    </div>
  );
}
