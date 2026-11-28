'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from '@/lib/leafletSafe';
import type { FitPadding } from './DiscoveryMap';

interface BoundaryFeature {
  type: 'Feature';
  properties: { kind: 'city' | 'district' | 'province'; name: string; code?: string; province?: string };
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

/** Davao City's PSGC code: its own outline and districts live in davao-boundaries.json. */
const DAVAO_CITY_CODE = '112402000';
const DAVAO_DEL_SUR_CODE = '112400000';

/** The 5 Davao provinces and their other cities / municipalities (PSGC codes), from OpenStreetMap
 *  (public/geo/davao-region-boundaries.json), loaded only when a province or city is chosen. */
let regionBoundaries: Promise<BoundaryFeature[]> | null = null;
function loadRegionBoundaries(): Promise<BoundaryFeature[]> {
  regionBoundaries ??= fetch('/geo/davao-region-boundaries.json')
    .then((res) => (res.ok ? res.json() : { features: [] }))
    .then((fc: { features: BoundaryFeature[] }) => fc.features)
    .catch(() => {
      regionBoundaries = null;
      return [];
    });
  return regionBoundaries;
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
// A province chosen on its own: its whole area lightly tinted. Behind a chosen city: a faint dashed outline.
const PROVINCE: L.PathOptions = { color: '#4A3428', weight: 2.5, opacity: 0.9, fillColor: '#9A8073', fillOpacity: 0.08, interactive: false };
const PROVINCE_BEHIND: L.PathOptions = { color: '#6B4E3E', weight: 1.5, dashArray: '4 6', opacity: 0.7, fillOpacity: 0, interactive: false };

interface DistrictHighlightProps {
  /** The chosen district, or null for all of Davao City. */
  readonly district: string | null;
  /** Draw Davao City's outline (the map screen); off elsewhere unless a district is chosen. */
  readonly showCity?: boolean;
  /** Frame the whole city now (the person just picked "All Davao"). */
  readonly fitCity?: boolean;
  /** The chosen province (PSGC code): outlined and framed when no city / district is chosen. */
  readonly province?: string | null;
  /** The chosen city or municipality (PSGC code): filled, with its province dashed behind. */
  readonly city?: string | null;
  readonly pad?: FitPadding;
}

/**
 * Davao City and its districts on the map. "All Davao": the city's outline with a light tint. A district: the city
 * as a dashed outline behind it, the district filled and outlined, and the map moved to fit it in the part not under
 * the panel or sheet. Shapes never take taps, so the shop pins on top stay clickable.
 */
export default function DistrictHighlight({ district, showCity = false, fitCity = false, pad, province = null, city = null }: DistrictHighlightProps) {
  const map = useMap();
  const [features, setFeatures] = useState<BoundaryFeature[]>([]);
  const inDavaoCity = !city || city === DAVAO_CITY_CODE;
  // Davao City's own file is also needed to outline it inside Davao del Sur.
  const wanted = (showCity || Boolean(district) || city === DAVAO_CITY_CODE || province === DAVAO_DEL_SUR_CODE) && inDavaoCity;
  const [region, setRegion] = useState<BoundaryFeature[]>([]);
  const regionWanted = Boolean(province) || Boolean(city);

  useEffect(() => {
    if (!wanted) return;
    let alive = true;
    void loadBoundaries().then((f) => { if (alive) setFeatures(f); });
    return () => { alive = false; };
  }, [wanted]);

  useEffect(() => {
    if (!regionWanted) return;
    let alive = true;
    void loadRegionBoundaries().then((f) => { if (alive) setRegion(f); });
    return () => { alive = false; };
  }, [regionWanted]);

  // The free area is read when the place is chosen, but a later change (the sheet moving, a shop opened) does not
  // refit: that would yank the map away from the shop the person just tapped.
  const padRef = useRef(pad);
  padRef.current = pad;
  const fit = (bounds: L.LatLngBounds, maxZoom: number) => {
    const { top = 0, left = 0, bottom = 0 } = padRef.current ?? {};
    map.fitBounds(bounds, { paddingTopLeft: [32 + left, 32 + top], paddingBottomRight: [32, 32 + bottom], maxZoom });
  };

  useEffect(() => {
    const layers = L.layerGroup().addTo(map);
    // The map may still be settling when the shapes arrive (first load, panel opening): frame now and once more a
    // moment later, so the chosen place always ends up in view.
    let target: { bounds: L.LatLngBounds; zoom: number } | null = null;
    const frame = (bounds: L.LatLngBounds, zoom: number) => { target = { bounds, zoom }; fit(bounds, zoom); };
    const provinceCode = province || region.find((f) => f.properties.code === city)?.properties.province || null;
    const provinceFeat = provinceCode ? region.find((f) => f.properties.kind === 'province' && f.properties.code === provinceCode) : undefined;

    if (city && city !== DAVAO_CITY_CODE) {
      // Another city / municipality: it filled, its province dashed behind, the map framed on it.
      const cityFeat = region.find((f) => f.properties.kind === 'city' && f.properties.code === city);
      if (provinceFeat) L.geoJSON(provinceFeat, { style: PROVINCE_BEHIND }).addTo(layers);
      if (cityFeat) frame(L.geoJSON(cityFeat, { style: DISTRICT }).addTo(layers).getBounds(), 13);
    } else if (wanted && features.length > 0 && (district || city === DAVAO_CITY_CODE || !province)) {
      // Davao City (all of it, or one district), as before; with its province dashed behind once one is chosen.
      if (provinceFeat) L.geoJSON(provinceFeat, { style: PROVINCE_BEHIND }).addTo(layers);
      const davao = features.find((f) => f.properties.kind === 'city');
      const area = district ? features.find((f) => f.properties.kind === 'district' && f.properties.name.toLowerCase() === district.toLowerCase()) : undefined;
      const cityShape = davao ? L.geoJSON(davao, { style: area ? CITY_BEHIND : CITY_ALL }).addTo(layers) : null;
      if (area) frame(L.geoJSON(area, { style: DISTRICT }).addTo(layers).getBounds(), 15);
      else if ((fitCity || city === DAVAO_CITY_CODE) && cityShape) frame(cityShape.getBounds(), 12);
    } else if (province && provinceFeat) {
      // Only a province: its whole area, framed. Davao City counts as part of Davao del Sur (PSGC) though OpenStreetMap
      // draws it apart, so it is outlined with the province (once its own file has loaded).
      const bounds = L.geoJSON(provinceFeat, { style: PROVINCE }).addTo(layers).getBounds();
      const davao = province === DAVAO_DEL_SUR_CODE ? features.find((f) => f.properties.kind === 'city') : undefined;
      if (davao) bounds.extend(L.geoJSON(davao, { style: PROVINCE }).addTo(layers).getBounds());
      frame(bounds, 11);
    }

    const again = window.setTimeout(() => { if (target) fit(target.bounds, target.zoom); }, 700);
    return () => { window.clearTimeout(again); layers.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fit` reads the padding from a ref on purpose
  }, [map, wanted, district, fitCity, features, region, province, city]);

  return null;
}
