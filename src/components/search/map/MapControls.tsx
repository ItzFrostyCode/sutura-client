import type { CSSProperties } from 'react';
import { LocateFixed, Menu, Minus, Plus, X } from 'lucide-react';

interface MapControlsProps {
  readonly onLocate: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly locating: boolean;
  /**
   * When given, a brown round button always shows at the bottom of the column:
   * X when the panel is open, hamburger (☰) when the panel is hidden.
   * Hidden on desktop (lg+) where the side card is always visible.
   */
  readonly onTogglePanel?: () => void;
  readonly panelOpen?: boolean;
  /**
   * On mobile / tablet: current height of the bottom sheet in px.
   * The button column sits this many px + 16 px above the bottom of the screen
   * so the buttons are never hidden under the sheet.
   * Pass 0 (or omit) when the panel is closed.
   */
  readonly sheetHeight?: number;
}

const circleBtn =
  'flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_12px_rgba(45,42,38,0.18)] transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-60';
const toggleBtnCls =
  'flex h-12 w-12 items-center justify-center rounded-full bg-taupe-dark text-white shadow-[0_2px_12px_rgba(45,42,38,0.28)] transition-opacity hover:opacity-90 active:opacity-70';

/**
 * Four map-control buttons stacked in a vertical column at the right edge of the map.
 *
 * – Desktop (lg+): fixed at bottom-right above the nav bar; toggle button hidden.
 * – Mobile / tablet: sticky at bottom-right; rises above the bottom sheet via
 *   an inline `bottom` style that matches `sheetHeight + 16px` (plus the nav bar).
 */
export default function MapControls({
  onLocate,
  onZoomIn,
  onZoomOut,
  locating,
  onTogglePanel,
  panelOpen = false,
  sheetHeight = 0,
}: MapControlsProps) {
  // Desktop: Tailwind class handles positioning (lg:bottom-…).
  // Mobile: we add bottom dynamically based on the sheet height.
  // The nav bar itself takes --bottom-nav-space (≈ 72 px).
  const NAV_PX = 76;
  const mobileBottomPx = sheetHeight > 0
    ? sheetHeight + NAV_PX + 16   // above sheet + nav
    : NAV_PX + 16;                 // above nav only

  const style: CSSProperties = {
    // The Tailwind lg: class will win on desktop via specificity; on mobile we use this.
    bottom: mobileBottomPx,
    right: 16,
    transition: 'bottom 300ms ease-in-out',
  };

  return (
    <div
      role="group"
      aria-label="Map controls"
      className="absolute z-30 flex flex-col gap-2 lg:bottom-[calc(var(--bottom-nav-space)+8px)] lg:right-4"
      style={style}
    >
      <button type="button" onClick={onLocate} disabled={locating} aria-label="Go to my location" className={circleBtn}>
        <LocateFixed size={22} className={locating ? 'animate-pulse' : ''} />
      </button>
      <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={circleBtn}>
        <Plus size={22} />
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={circleBtn}>
        <Minus size={22} />
      </button>
      {onTogglePanel && (
        <button
          type="button"
          onClick={onTogglePanel}
          aria-label={panelOpen ? 'Hide search panel' : 'Show search and results'}
          className={`${toggleBtnCls} lg:hidden`}
        >
          {panelOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}
    </div>
  );
}
