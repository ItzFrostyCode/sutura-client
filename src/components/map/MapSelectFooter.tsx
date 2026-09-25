import { Check } from 'lucide-react';

interface MapSelectFooterProps {
  isSelectMode: boolean;
  hasSelectedBranch: boolean;
  reverseLoading: boolean;
  pickedAddress: string;
  onConfirmPickedLocation: () => void;
}

export default function MapSelectFooter({
  isSelectMode,
  hasSelectedBranch,
  reverseLoading,
  pickedAddress,
  onConfirmPickedLocation,
}: MapSelectFooterProps) {
  if (!isSelectMode || hasSelectedBranch) return null;

  return (
    <div
      className="md:hidden shrink-0 border-t border-line p-3 space-y-2.5 bg-canvas z-10"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-0.5">Address</p>
        <p className="text-xs text-ink font-medium leading-snug line-clamp-2">
          {reverseLoading
            ? 'Locating address…'
            : pickedAddress || 'Move the map or tap a store to choose a spot'}
        </p>
      </div>

      <button
        type="button"
        onClick={onConfirmPickedLocation}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-taupe text-white text-xs font-semibold hover:bg-taupe-hover transition-colors shadow-xs cursor-pointer"
      >
        <Check size={15} /> Choose this Location
      </button>
    </div>
  );
}
