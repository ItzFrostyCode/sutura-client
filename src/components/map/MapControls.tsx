'use client';

import { LocateFixed, Minus, Plus } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';

/** Round map controls on the right edge: locate me, zoom in, zoom out. */
export default function MapControls({ mapRef, onLocate, locating, located }: {
  readonly mapRef: React.RefObject<LeafletMap | null>;
  readonly onLocate: () => void;
  readonly locating: boolean;
  readonly located: boolean;
}) {
  const btn =
    'flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-[0_3px_10px_rgba(45,42,38,0.16)] transition-colors hover:bg-sunken disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe';

  return (
    <div className="absolute right-3 md:right-5 bottom-[calc(52dvh+12px)] md:bottom-6 z-[1000] flex flex-col gap-2.5">
      <button type="button" onClick={onLocate} disabled={locating} aria-label={located ? 'Stop using my location' : 'Show shops near me'} title={located ? 'Stop using my location' : 'Near me'} className={btn}>
        <LocateFixed size={20} aria-hidden="true" className={locating ? 'animate-pulse text-taupe' : located ? 'text-blue-600' : ''} />
      </button>
      <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in" className={`${btn} hidden md:flex`}>
        <Plus size={20} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out" className={`${btn} hidden md:flex`}>
        <Minus size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
