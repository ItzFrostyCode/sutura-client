import { Check, LocateFixed, Minus, Plus } from 'lucide-react';

interface ChooseConfirmCardProps {
  readonly address: string;
  readonly reverseLoading: boolean;
  readonly locating: boolean;
  readonly onLocate: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onConfirm: () => void;
  readonly confirmLabel?: string;
}

const button = 'flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_12px_rgba(45,42,38,0.18)] transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-60';

/** The bottom of the screen: my location, zoom in and zoom out (the same three buttons as the search map), then a soft card with the address under the pin and the one button that chooses it. */
export default function ChooseConfirmCard({
  address,
  reverseLoading,
  locating,
  onLocate,
  onZoomIn,
  onZoomOut,
  onConfirm,
  confirmLabel = 'Choose this location',
}: ChooseConfirmCardProps) {
  return (
    <div className="flex flex-col items-end gap-3">
      <div role="group" aria-label="Map controls" className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          aria-label={locating ? 'Detecting your GPS location…' : 'Go to my location'}
          title={locating ? 'Detecting GPS…' : 'Go to my location'}
          className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-[0_2px_12px_rgba(45,42,38,0.18)] transition-all active:scale-95 ${
            locating
              ? 'cursor-wait text-taupe-dark ring-2 ring-taupe/60 shadow-[0_0_16px_rgba(156,128,105,0.35)]'
              : 'text-ink hover:opacity-90 active:opacity-70'
          }`}
        >
          {locating && (
            <>
              {/* Tactile radar sonar ping waves expanding outward */}
              <span className="pointer-events-none absolute -inset-1 animate-ping rounded-full bg-taupe/25 duration-1000" aria-hidden="true" />
              <span className="pointer-events-none absolute -inset-2 animate-pulse rounded-full border border-taupe/30" aria-hidden="true" />
              {/* Dynamic rotating radar perimeter ring */}
              <span className="pointer-events-none absolute inset-0.5 animate-spin rounded-full border-2 border-taupe-dark border-t-transparent" aria-hidden="true" />
            </>
          )}
          <LocateFixed
            size={22}
            className={`relative z-10 transition-all ${
              locating ? 'animate-pulse scale-90 text-taupe-dark' : 'text-ink'
            }`}
            aria-hidden="true"
          />
        </button>
        <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={button}><Plus size={22} /></button>
        <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={button}><Minus size={22} /></button>
      </div>

      <div className="card-soft w-full p-4" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        <p className="mobile-overline text-ink-faint">Chosen place</p>
        <p className="mobile-body-md mt-1 line-clamp-2 text-ink">
          {reverseLoading ? 'Finding the address…' : address || 'Move the map to put the pin on your place'}
        </p>
        <button type="button" onClick={onConfirm} className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80">
          <Check size={18} /> {confirmLabel}
        </button>
      </div>
    </div>
  );
}
