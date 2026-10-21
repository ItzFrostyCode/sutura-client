import { LocateFixed, Menu, Minus, Plus, X } from 'lucide-react';

interface MapControlsProps {
  readonly onLocate: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly locating: boolean;
  /** When given, a brown round button sits at the bottom: X while the panel is open, hamburger once it is hidden. */
  readonly onTogglePanel?: () => void;
  readonly panelOpen?: boolean;
  /** Lay the buttons out left to right instead of top to bottom, when there is no room above the sheet for the whole column. */
  readonly row?: boolean;
  readonly className?: string;
}

const button = 'flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_12px_rgba(45,42,38,0.18)] transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-60';

/** Top to bottom (or left to right when short of room): my location, zoom in, zoom out, and (tablet and phone) X / hamburger for the panel. Dragging and pinching the map work on their own. */
export default function MapControls({ onLocate, onZoomIn, onZoomOut, locating, onTogglePanel, panelOpen, row = false, className = '' }: MapControlsProps) {
  return (
    <div role="group" aria-label="Map controls" className={`absolute right-4 z-20 flex gap-2 ${row ? 'flex-row' : 'flex-col'} ${className}`}>
      <button type="button" onClick={onLocate} disabled={locating} aria-label="Go to my location" className={button}>
        <LocateFixed size={22} className={locating ? 'animate-pulse' : ''} />
      </button>
      <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={button}>
        <Plus size={22} />
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={button}>
        <Minus size={22} />
      </button>
      {onTogglePanel && !panelOpen && (
        <button
          type="button"
          onClick={onTogglePanel}
          aria-label="Show search and results"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-taupe-dark text-white shadow-[0_2px_12px_rgba(45,42,38,0.28)] transition-opacity hover:opacity-90 active:opacity-70 lg:hidden"
        >
          <Menu size={22} />
        </button>
      )}
    </div>
  );
}
