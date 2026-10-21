'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from '@/lib/leafletSafe';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import YouMarker from './YouMarker';
import { focusOn } from '@/lib/mapFocus';

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
// `selected` (the branch picked on the catalog item's Find-in-store map): a taupe ring and a little larger.
export function buildStorePinIcon(
  logoPath: string | null,
  badgeTextOrIsMain?: string | boolean | null,
  isOpen?: boolean,
  selected = false,
): L.DivIcon {
  const ringColor = selected ? '#9A8073' : '#2D2A26';
  const statusColor = isOpen ? '#22c55e' : '#ef4444';
  const logoHtml = logoPath
    ? `<img src="${getMediaUrl(logoPath)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:#FAF6F3;">${FALLBACK_SVG}</span>`
    : `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;background:#FAF6F3;">${FALLBACK_SVG}</span>`;

  let badge: string | null = null;
  if (typeof badgeTextOrIsMain === 'string') {
    badge = badgeTextOrIsMain.trim() || null;
  } else if (badgeTextOrIsMain === true) {
    badge = 'MAIN';
  }

  const isMainBadge = badge === 'MAIN';
  const badgeHtml = badge
    ? `<span style="position:absolute;top:-4px;right:-7px;background:${isMainBadge ? '#2D2A26' : '#8A7063'};color:#fff;font-size:8.5px;font-weight:700;line-height:1;letter-spacing:0.02em;${isMainBadge ? 'padding:2px 4.5px;border-radius:6px;' : 'width:17px;height:17px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;'}border:1.5px solid #fff;z-index:11;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${badge}</span>`
    : '';

  const html = `
    <div style="position:relative;width:40px;height:52px;transform-origin:50% 100%;transform:scale(${selected ? 1.15 : 1});">
      <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid ${ringColor};box-shadow:0 2px 6px rgba(45,42,38,0.45);background:#fff;">
        ${logoHtml}
      </div>
      <div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${ringColor};"></div>
      
      <!-- Online (Green) / Offline (Red) Indicator -->
      <span style="position:absolute;bottom:10px;right:-2px;width:12px;height:12px;border-radius:50%;background:${statusColor};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.35);z-index:10;" title="${isOpen ? 'Online (Open now)' : 'Offline (Closed now)'}"></span>

      ${badgeHtml}
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

/** A small "you are here" dot, for maps without the full You marker (the catalog item's Find-in-store map). */
export const userLocationIcon = L.divIcon({
  className: '',
  html: '<span style="position:relative;display:block;width:16px;height:16px;"><span style="position:absolute;inset:0;border-radius:9999px;background:#3B82F6;opacity:0.35;animation:sutura-pulse 1.8s ease-out infinite;"></span><span style="position:absolute;inset:3px;border-radius:9999px;background:#3B82F6;border:2px solid white;"></span></span><style>@keyframes sutura-pulse{0%{transform:scale(0.6);opacity:0.6;}100%{transform:scale(2.2);opacity:0;}}</style>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Leaflet re-creates a pin whenever its icon object changes, and the live navigation re-renders the map about once a second,
// so an icon is built once per look (logo, badge, open, selected) and reused.
const pinIcons = new Map<string, L.DivIcon>();
function pinIcon(logoPath: string | null, badgeText?: string | boolean | null, isOpen?: boolean, selected = false): L.DivIcon {
  const key = `${logoPath ?? ''}|${badgeText ?? ''}|${isOpen}|${selected}`;
  let icon = pinIcons.get(key);
  if (!icon) {
    icon = buildStorePinIcon(logoPath, badgeText, isOpen, selected);
    pinIcons.set(key, icon);
  }
  return icon;
}

export interface FitPadding { readonly top?: number; readonly left?: number; readonly bottom?: number }

function FitBounds({ points, disable, pad }: { readonly points: [number, number][]; readonly disable?: boolean; readonly pad?: FitPadding }) {
  const map = useMap();
  const prevKeyRef = useRef<string>('');
  const pointsKey = points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join('|');
  // The free area changes when a panel or sheet moves, so the fit is redone for a new padding as well.
  const padKey = `${pad?.top ?? 0}|${pad?.left ?? 0}|${pad?.bottom ?? 0}`;

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
    if (!pointsKey) return;
    const fitKey = `${pointsKey}#${padKey}`;
    if (prevKeyRef.current === fitKey) return;
    // A fit that is switched off still counts as seen, so switching it back on does not suddenly zoom out to the pins.
    prevKeyRef.current = fitKey;
    if (disable) return;

    const top = pad?.top ?? 0;
    const left = pad?.left ?? 0;
    const bottom = pad?.bottom ?? 0;
    if (points.length === 1) {
      // One place: zoom in to it (street level), in the part of the map that is not covered.
      focusOn(map, points[0][0], points[0][1], { left, top, bottom }, false);
    } else if (points.length > 1) {
      map.fitBounds(points, { paddingTopLeft: [40 + left, 40 + top], paddingBottomRight: [40, 40 + bottom] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the pins or the free area change
  }, [map, points, pointsKey, padKey, disable]);
  return null;
}

/** "Focus on me": the map stays centred on the person at street level (in the part not under a panel or sheet) until they drag it. */
function FocusOnUser({ position, pad, active }: { readonly position: { lat: number; lng: number } | null; readonly pad?: FitPadding; readonly active: boolean }) {
  const map = useMap();
  const left = pad?.left ?? 0;
  const top = pad?.top ?? 0;
  const bottom = pad?.bottom ?? 0;
  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (!active || lat === undefined || lng === undefined) return;
    focusOn(map, lat, lng, { left, top, bottom });
  }, [map, active, lat, lng, left, top, bottom]);
  return null;
}

/**
 * Keeps a moving person in view during navigation: when they get near the edge of the free part of the map (the part not
 * covered by the panel or sheet), the map glides so they are back in the middle of it. Dragging the map is the person's way to stop it.
 */
function FollowUser({ position, pad, onUserPan }: { readonly position: { lat: number; lng: number } | null; readonly pad?: FitPadding; readonly onUserPan?: () => void }) {
  const map = useMap();
  const left = pad?.left ?? 0;
  const top = pad?.top ?? 0;
  const bottom = pad?.bottom ?? 0;
  const lat = position?.lat;
  const lng = position?.lng;
  useMapEvents({ dragstart: () => onUserPan?.() });

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    const size = map.getSize();
    const at = map.latLngToContainerPoint([lat, lng]);
    const edge = 72;
    const inside = at.x > left + edge && at.x < size.x - edge && at.y > top + edge && at.y < size.y - bottom - edge;
    if (inside) return;
    const middle = L.point(left + (size.x - left) / 2, top + (size.y - top - bottom) / 2);
    map.panBy(at.subtract(middle), { animate: true, duration: 0.6 });
  }, [map, lat, lng, left, top, bottom]);
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
  badgeText?: string | null;
  isSelected?: boolean;
}

/** Locks all map panning and zooming when interactive is false (e.g. when panel is expanded). */
function MapInteractionLock({ interactive = true }: { readonly interactive?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!interactive) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    }
  }, [map, interactive]);
  return null;
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
  /** Room to leave free when fitting pins into view (a side panel or bottom sheet covers part of the map). */
  readonly fitPadding?: FitPadding;
  /** A road route to draw ([lat, lng] pairs); the map then fits the route instead of the pins. */
  readonly route?: [number, number][] | null;
  /** The whole route to fit the map to; unlike `route` it does not shrink as the person moves along it. */
  readonly routeFit?: [number, number][] | null;
  /** Where the map opens (instead of fitting the pins), e.g. a saved place at street level. */
  readonly initialView?: { lat: number; lng: number; zoom: number };
  /** While true, the map is held on the person (street level) instead of fitting all the pins; dragging the map ends it via `onUserPan`. */
  readonly focusUser?: boolean;
  /** Direction of travel in degrees from the GPS while moving fast; the "You" beam otherwise follows the phone's compass. */
  readonly userCourse?: number | null;
  /** While set, the map follows this moving position. */
  readonly followPosition?: { lat: number; lng: number } | null;
  /** The person dragged the map: stop following. */
  readonly onUserPan?: () => void;
  /** When false, all map dragging, zooming, and pointer interactions are disabled. */
  readonly interactive?: boolean;
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
  fitPadding,
  route,
  routeFit,
  userCourse,
  initialView,
  focusUser,
  followPosition,
  onUserPan,
  interactive = true,
}: DiscoveryMapProps) {
  const gate = useGuestGatedHref();
  const hasNoResults = branches.length === 0 && !userLocation && !selectable;

  const points = useMemo(
    () => branches.map((b) => [b.latitude, b.longitude] as [number, number]),
    [branches]
  );
  // Fitting needs only a sample of a long road line, and always both ends.
  const routeBounds = useMemo(() => {
    const line = routeFit ?? route;
    if (!line || line.length < 2) return null;
    const step = Math.max(1, Math.floor(line.length / 40));
    return [...line.filter((_, i) => i % step === 0), line[line.length - 1]];
  }, [routeFit, route]);
  const boundsPoints = useMemo(
    () => routeBounds ?? (userLocation ? [...points, [userLocation.lat, userLocation.lng] as [number, number]] : points),
    [routeBounds, points, userLocation],
  );
  const center = useMemo(
    () => boundsPoints[0] ?? [7.0731, 125.6128], // Davao City fallback
    [boundsPoints]
  );

  return (
    <div
      className={`${fullScreen ? 'absolute inset-0' : 'relative rounded-2xl overflow-hidden border border-line'} ${interactive === false ? 'pointer-events-none select-none' : ''}`}
      style={fullScreen ? undefined : { height: 520 }}
    >
      <MapContainer
        center={initialView ? [initialView.lat, initialView.lng] : center}
        zoom={initialView?.zoom ?? 14}
        maxZoom={21}
        minZoom={3}
        // Choosing a place: the pin is fixed in the middle, so zooming (wheel, trackpad pinch, fingers, double tap) goes around the pin
        // and the place under it stays put; only dragging moves it.
        scrollWheelZoom={selectable ? 'center' : true}
        touchZoom={selectable ? 'center' : true}
        doubleClickZoom={selectable ? 'center' : true}
        zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <MapInteractionLock interactive={interactive} />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={21}
          maxNativeZoom={19}
        />
        <MapEventsHandler onMoveEnd={onMoveEnd} mapRef={mapRef} enabled={selectable} />
        <FitBounds points={boundsPoints} disable={disableFitBounds} pad={fitPadding} />
        <FocusOnUser position={userLocation ?? null} pad={fitPadding} active={Boolean(focusUser)} />
        <FollowUser position={followPosition ?? null} pad={fitPadding} onUserPan={onUserPan} />
        {route && route.length > 1 && <Polyline positions={route} pathOptions={{ color: '#6B4E3E', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />}
        {userLocation && <YouMarker position={userLocation} course={userCourse} />}
        {branches.map((b) => {
          const key = `${b.storeSlug}-${b.branchId}`;
          return (
            <Marker
              key={key}
              position={[b.latitude, b.longitude]}
              icon={pinIcon(b.storeLogoPath, b.badgeText ?? null, b.isOpen, Boolean(b.isSelected))}
              zIndexOffset={b.isSelected ? 1000 : 0}
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
            No stores with map coordinates match these filters yet.
          </p>
        </div>
      )}
    </div>
  );
}
