import { Check } from 'lucide-react';

interface LocationPickerFooterProps {
  error: string;
  reverseLoading: boolean;
  address: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function LocationPickerFooter({
  error,
  reverseLoading,
  address,
  confirmLabel,
  onConfirm,
}: Readonly<LocationPickerFooterProps>) {
  return (
    <div className="shrink-0 border-t border-line p-3 sm:p-4 space-y-3 bg-canvas">
      {error && <p className="mobile-caption text-danger font-normal">{error}</p>}

      <div>
        <p className="mobile-overline text-ink-faint mb-0.5">Address</p>
        <p className="mobile-body-sm text-ink font-normal leading-snug line-clamp-2">
          {reverseLoading ? 'Locating address…' : (address || 'Move the map to put the pin on your place')}
        </p>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="btn-primary-mobile w-full bg-taupe hover:bg-taupe-hover text-white gap-2 shadow-xs"
      >
        <Check size={18} /> {confirmLabel}
      </button>
    </div>
  );
}
