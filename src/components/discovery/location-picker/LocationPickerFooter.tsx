import Image from 'next/image';
import { Check, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { StoreMapPin } from './locationPickerTypes';

interface LocationPickerFooterProps {
  error: string;
  selectedStore: StoreMapPin | null;
  onDeselectStore: () => void;
  reverseLoading: boolean;
  address: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function LocationPickerFooter({
  error,
  selectedStore,
  onDeselectStore,
  reverseLoading,
  address,
  confirmLabel,
  onConfirm,
}: Readonly<LocationPickerFooterProps>) {
  return (
    <div className="shrink-0 border-t border-line p-3 sm:p-4 space-y-3 bg-canvas">
      {error && <p className="mobile-caption text-danger font-normal">{error}</p>}

      {/* Selected Store Card Preview */}
      {selectedStore && (
        <div className="flex items-center gap-2.5 p-2.5 bg-sunken rounded-xl border border-line animate-in fade-in duration-150">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-line shrink-0 bg-canvas">
            {selectedStore.logoPath ? (
              <Image
                src={getMediaUrl(selectedStore.logoPath)}
                alt={selectedStore.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-taupe">
                {selectedStore.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="mobile-body-sm font-semibold text-ink truncate leading-tight">
                {selectedStore.name}
              </span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                selectedStore.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedStore.isOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
                {selectedStore.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <p className="mobile-caption text-ink-muted truncate font-normal">
              {selectedStore.branchName}{selectedStore.district ? ` • ${selectedStore.district}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onDeselectStore}
            className="text-ink-faint hover:text-ink p-1.5 touch-target-44 w-8 h-8"
            aria-label="Deselect store"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div>
        <p className="mobile-overline text-ink-faint mb-0.5">Address</p>
        <p className="mobile-body-sm text-ink font-normal leading-snug line-clamp-2">
          {reverseLoading ? 'Locating address…' : (address || 'Move the map or tap a store to choose a spot')}
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
