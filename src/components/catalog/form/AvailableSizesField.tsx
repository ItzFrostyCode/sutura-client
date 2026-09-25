import React from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AvailableSizesFieldProps {
  readonly showMoreDetails: boolean;
  readonly setShowMoreDetails: React.Dispatch<React.SetStateAction<boolean>>;
  readonly sizes: string[];
  readonly sizeInput: string;
  readonly setSizeInput: (v: string) => void;
  readonly onAddSize: () => void;
  readonly onRemoveSize: (size: string) => void;
}

export function AvailableSizesField({
  showMoreDetails,
  setShowMoreDetails,
  sizes,
  sizeInput,
  setSizeInput,
  onAddSize,
  onRemoveSize,
}: AvailableSizesFieldProps) {
  return (
    <div className="border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setShowMoreDetails(v => !v)}
        className="flex items-center gap-2 text-xs font-semibold text-taupe hover:text-ink transition-colors cursor-pointer"
      >
        <span className={`w-5 h-5 rounded-full border border-line bg-canvas flex items-center justify-center transition-transform ${showMoreDetails ? 'rotate-180' : ''}`}>
          <ChevronDown size={12} />
        </span>
        {showMoreDetails ? 'Hide optional details' : 'Add available sizes →'}
      </button>

      {showMoreDetails && (
        <div className="mt-5 grid grid-cols-1 gap-5">
          <div>
            <label htmlFor="catalog-sizes" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
              Available Sizes <span className="text-ink-faint normal-case">— reference range for this design; leave blank if fully custom-measured</span>
            </label>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {sizes.map(size => (
                  <span key={size} className="flex items-center gap-1 px-3 py-1 bg-taupe text-white text-sm rounded-full">
                    {size}
                    <button
                      type="button"
                      onClick={() => onRemoveSize(size)}
                      className="hover:text-white/70 focus:outline-none cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                id="catalog-sizes"
                type="text"
                value={sizeInput}
                onChange={e => setSizeInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddSize();
                  }
                }}
                placeholder="e.g. S, then press Enter"
                className="flex-1 px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
              />
              <button
                type="button"
                onClick={onAddSize}
                className="shrink-0 px-4 rounded-xl bg-taupe/10 text-taupe hover:bg-taupe/20 transition-colors text-sm font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
