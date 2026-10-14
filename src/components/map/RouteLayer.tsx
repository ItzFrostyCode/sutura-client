'use client';

import { useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';

/**
 * The in-app directions line (useDirections), shared by every Leaflet map
 * that shows a route: a white casing under a brown stroke so it reads over
 * any map colour, framed on first draw. Extra top padding keeps it clear of
 * the floating "Active navigation" card. Render inside a <MapContainer>.
 */
export default function RouteLayer({ path }: { readonly path: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (path.length > 1) map.fitBounds(path, { paddingTopLeft: [40, 170], paddingBottomRight: [40, 40] });
  }, [map, path]);
  if (path.length < 2) return null;
  return (
    <>
      <Polyline positions={path} pathOptions={{ color: '#FFFFFF', weight: 9, opacity: 0.9 }} />
      <Polyline positions={path} pathOptions={{ color: '#6B4E3E', weight: 5, opacity: 0.95 }} />
    </>
  );
}
