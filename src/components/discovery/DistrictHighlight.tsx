'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from '@/lib/leafletSafe';
import type { FitPadding } from './DiscoveryMap';

interface BoundaryFeature {
  type: 'Feature';
  properties: { kind: 'city' | 'district'; name: string };
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

/** Davao City and its 11 districts, from OpenStreetMap (public/geo/davao-boundaries.json), loaded once per visit. */
let boundaries: Promise<BoundaryFeature[]> | null = null;
function loadBoundaries(): Promise<BoundaryFeature[]> {
  boundaries ??= fetch('/geo/davao-boundaries.json')
    .then((res) => (res.ok ? res.json() : { features: [] }))
    .then((fc: { features: BoundaryFeature[] }) => fc.features)
    .catch(() => {
      boundaries = null; // try again next time
      return [];
    });
  return boundaries;
}

// "All Davao": the whole city is the highlighted area. A district chosen: the city steps back to a dashed outline.
const CITY_ALL: L.PathOptions = { color: '#4A3428', weight: 2.5, opacity: 0.9, fillColor: '#9A8073', fillOpacity: 0.1, interactive: false };
const CITY_BEHIND: L.PathOptions = { color: '#6B4E3E', weight: 2, dashArray: '6 6', opacity: 0.8, fillColor: '#9A8073', fillOpacity: 0.04, interactive: false };
const DISTRICT: L.PathOptions = { color: '#4A3428', weight: 3, opacity: 1, fillColor: '#9A8073', fillOpacity: 0.22, interactive: false };

interface DistrictHighlightProps {
  /** The chosen district, or null for all of Davao City. */
  readonly district: string | null;
  /** Draw Davao City's outline (the map screen); off elsewhere unless a district is chosen. */
  readonly showCity?: boolean;
  /** Frame the whole city now (the person just picked "All Davao"). */
  readonly fitCity?: boolean;
  readonly pad?: FitPadding;
}

/**
 * Davao City and its districts on the map. "All Davao": the city's outline with a light tint. A district: the city
 * as a dashed outline behind it, the district filled and outlined, and the map moved to fit it in the part not under
 * the panel or sheet. Shapes never take taps, so the shop pins on top stay clickable.
 */
export default function DistrictHighlight({ district, showCity = false, fitCity = false, pad }: DistrictHighlightProps) {
  const map = useMap();
  const [features, setFeatures] = useState<BoundaryFeature[]>([]);
  const wanted = showCity || Boolean(district);

  useEffect(() => {
    if (!wanted) return;
    let alive = true;
    void loadBoundaries().then((f) => { if (alive) setFeatures(f); });
    return () => { alive = false; };
  }, [wanted]);

  // The free area is read when the place is chosen, but a later change (the sheet moving, a shop opened) does not
  // refit: that would yank the map away from the shop the person just tapped.
  const padRef = useRef(pad);
  padRef.current = pad;
  const fit = (bounds: L.LatLngBounds, maxZoom: number) => {
    const { top = 0, left = 0, bottom = 0 } = padRef.current ?? {};
    map.fitBounds(bounds, { paddingTopLeft: [32 + left, 32 + top], paddingBottomRight: [32, 32 + bottom], maxZoom });
  };

  useEffect(() => {
    if (!wanted || features.length === 0) return;
    const city = features.find((f) => f.properties.kind === 'city');
    const area = district ? features.find((f) => f.properties.kind === 'district' && f.properties.name.toLowerCase() === district.toLowerCase()) : undefined;

    const layers = L.layerGroup().addTo(map);
    const cityShape = city ? L.geoJSON(city, { style: area ? CITY_BEHIND : CITY_ALL }).addTo(layers) : null;
    if (area) fit(L.geoJSON(area, { style: DISTRICT }).addTo(layers).getBounds(), 15);
    else if (fitCity && cityShape) fit(cityShape.getBounds(), 13);

    return () => { layers.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fit` reads the padding from a ref on purpose
  }, [map, wanted, district, fitCity, features]);

  return null;
}
