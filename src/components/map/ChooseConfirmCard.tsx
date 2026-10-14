import { Check, LocateFixed, Minus, Plus } from 'lucide-react';

interface ChooseConfirmCardProps {
  readonly address: string;
  readonly reverseLoading: boolean;
  readonly locating: boolean;
  readonly onLocate: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onConfirm: () => void;
}

const button = 'flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_12px_rgba(45,42,38,0.18)] transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-60';

/** The bottom of the screen: my location, zoom in and zoom out (the same three buttons as the search map), then a soft card with the address under the pin and the one button that chooses it. */
export default function ChooseConfirmCard({ address, reverseLoading, locating, onLocate, onZoomIn, onZoomOut, onConfirm }: ChooseConfirmCardProps) {
  return (
    <div className="flex flex-col items-end gap-3">
      <div role="group" aria-label="Map controls" className="flex flex-col gap-2">
        <button type="button" onClick={onLocate} disabled={locating} aria-label="Go to my location" className={button}>
          <LocateFixed size={22} className={locating ? 'animate-pulse' : ''} />
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
          <Check size={18} /> Choose this location
        </button>
      </div>
    </div>
  );
}
