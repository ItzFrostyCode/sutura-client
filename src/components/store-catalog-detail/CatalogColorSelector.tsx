import React from 'react';
import { CatalogColorOption } from '@/lib/fabricHelper';
import { getMediaUrl } from '@/lib/media';

interface CatalogColorSelectorProps {
  options: CatalogColorOption[];
  selectedColor: string;
  onSelectColor: (option: CatalogColorOption) => void;
}

// Photo swatch: each option shows the actual reference photo for that
// color (opt.modelImage — either a photo uploaded specifically for that
// color, or the item's primary photo as a fallback) next to its name, so
// "what am I actually getting" is answered by a real picture, not a
// guessed CSS color dot standing in for it.
export default function CatalogColorSelector({
  options,
  selectedColor,
  onSelectColor,
}: CatalogColorSelectorProps) {
  if (!options || options.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Available product colors"
    >
      {options.map((opt) => {
        const isSelected = opt.name.toLowerCase() === selectedColor.toLowerCase();

        return (
          <button
            key={opt.name}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelectColor(opt)}
            aria-label={`Color: ${opt.name}`}
            className={`inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'border-taupe bg-taupe/[0.08] shadow-sm'
                : 'border-line hover:border-taupe/50 bg-surface'
            }`}
          >
            {opt.modelImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getMediaUrl(opt.modelImage)}
                alt=""
                className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-black/10"
              />
            ) : (
              <span
                aria-hidden
                className="w-6 h-6 rounded-full shrink-0 ring-1 ring-black/10 bg-sunken"
              />
            )}
            <span className="text-ink-body">{opt.name}</span>
          </button>
        );
      })}
    </div>
  );
}
