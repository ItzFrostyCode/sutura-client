import { Check, MapPin } from 'lucide-react';

interface LocationPickerFooterProps {
  error: string;
  reverseLoading: boolean;
  address: string;
  confirmLabel: string;
  onConfirm: () => void;
}

// The chosen spot and one button, floating at the bottom of the full-screen map.
export default function LocationPickerFooter({
  error,
  reverseLoading,
  address,
  confirmLabel,
  onConfirm,
}: Readonly<LocationPickerFooterProps>) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[600] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-canvas p-4 space-y-3 shadow-lg pointer-events-auto">
        {error && <p className="mobile-caption text-danger font-normal" role="alert">{error}</p>}
        <div className="flex items-start gap-2.5">
          <MapPin size={18} className="mt-0.5 shrink-0 text-taupe" />
          <div className="min-w-0">
            <p className="mobile-overline text-ink-faint mb-0.5">Chosen spot</p>
            <p className="mobile-body-sm text-ink font-normal leading-snug line-clamp-2" aria-live="polite">
              {reverseLoading ? 'Finding the address…' : (address || 'Move the map so the pin sits on the spot')}
            </p>
          </div>
        </div>
        <button type="button" onClick={onConfirm} className="btn-primary-mobile w-full bg-taupe hover:bg-taupe-hover text-white gap-2 shadow-xs">
          <Check size={18} /> {confirmLabel}
        </button>
      </div>
    </div>
  );
}
