'use client';

import { useMemo, useState } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from '@/lib/leafletSafe';
import type { DiscoveryMapBranch } from './DiscoveryMap';

const CELL_PX = 64;
/** From this zoom (street level) every pin is shown on its own. */
const CLUSTER_UNTIL_ZOOM = 17;

const keyOf = (b: DiscoveryMapBranch) => `${b.storeSlug}-${b.branchId}`;

// Count bubble for a group of nearby branches; built once per count.
const bubbleIcons = new Map<number, L.DivIcon>();
function bubbleIcon(count: number): L.DivIcon {
  let icon = bubbleIcons.get(count);
  if (!icon) {
    const size = count < 5 ? 40 : count < 20 ? 46 : 54;
    icon = L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#6B4E3E;border:3px solid #fff;box-shadow:0 3px 10px rgba(45,42,38,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${count < 100 ? 15 : 13}px;font-family:inherit;">${count}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    bubbleIcons.set(count, icon);
  }
  return icon;
}

/**
 * Groups pins that fall in one ~64px screen cell at the current zoom into a numbered bubble. Zooming out merges them,
 * zooming in splits them; tapping a bubble zooms in until they split. The selected pin is never folded into a bubble.
 */
export default function ClusteredPins({ branches, iconFor, onSelect }: {
  readonly branches: DiscoveryMapBranch[];
  readonly iconFor: (b: DiscoveryMapBranch) => L.DivIcon;
  readonly onSelect: (b: DiscoveryMapBranch) => void;
}) {
  const map = useMap();
  const [viewTick, setViewTick] = useState(0);
  useMapEvents({ zoomend: () => setViewTick((t) => t + 1), moveend: () => setViewTick((t) => t + 1) });

  const groups = useMemo(() => {
    const zoom = map.getZoom();
    const free = branches.filter((b) => !b.isSelected);
    if (zoom >= CLUSTER_UNTIL_ZOOM) return free.map((b) => [b]);
    const cells = new Map<string, DiscoveryMapBranch[]>();
    free.forEach((b) => {
      const p = map.project([b.latitude, b.longitude], zoom);
      const cell = `${Math.floor(p.x / CELL_PX)}:${Math.floor(p.y / CELL_PX)}`;
      cells.set(cell, [...(cells.get(cell) ?? []), b]);
    });
    return [...cells.values()];
    // viewTick re-groups on every zoom and pan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, map, viewTick]);

  const selected = branches.filter((b) => b.isSelected);

  return (
    <>
      {groups.map((group) => {
        if (group.length === 1) {
          const b = group[0];
          return <Marker key={keyOf(b)} position={[b.latitude, b.longitude]} icon={iconFor(b)} title={b.storeName} eventHandlers={{ click: () => onSelect(b) }} />;
        }
        const lat = group.reduce((s, b) => s + b.latitude, 0) / group.length;
        const lng = group.reduce((s, b) => s + b.longitude, 0) / group.length;
        const bounds = L.latLngBounds(group.map((b) => [b.latitude, b.longitude] as [number, number]));
        return (
          <Marker
            key={`cluster-${group.map(keyOf).join('|')}`}
            position={[lat, lng]}
            icon={bubbleIcon(group.length)}
            title={`${group.length} shops here — tap to zoom in`}
            eventHandlers={{
              click: () => {
                // All in one spot (same building): go straight to street level.
                if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.setView([lat, lng], CLUSTER_UNTIL_ZOOM + 1);
                else map.fitBounds(bounds, { padding: [80, 80], maxZoom: CLUSTER_UNTIL_ZOOM + 1 });
              },
            }}
          />
        );
      })}
      {selected.map((b) => (
        <Marker key={keyOf(b)} position={[b.latitude, b.longitude]} icon={iconFor(b)} zIndexOffset={1000} title={b.storeName} eventHandlers={{ click: () => onSelect(b) }} />
      ))}
    </>
  );
}
