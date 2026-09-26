import React from 'react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media';
import { CatalogColorOption, getContrastTextColor } from '@/lib/fabricHelper';

interface CatalogColorSelectorProps {
  options: CatalogColorOption[];
  selectedColor: string;
  onSelectColor: (option: CatalogColorOption) => void;
  isFabricActive: boolean;
}

export default function CatalogColorSelector({
  options,
  selectedColor,
  onSelectColor,
  isFabricActive,
}: CatalogColorSelectorProps) {
  if (!options || options.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2 sm:gap-2.5 pt-0.5"
      role="radiogroup"
      aria-label="Available product colors"
    >
      {options.map((opt) => {
        const isSelected =
          opt.name.toLowerCase() === selectedColor.toLowerCase();
        const currentThumb = isFabricActive ? opt.fabricImage : opt.modelImage;
        const textColor = getContrastTextColor(opt.hex);

        return (
          <button
            key={opt.name}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelectColor(opt)}
            aria-label={`Color: ${opt.name}`}
            className={`group relative flex flex-col w-[76px] sm:w-[84px] rounded-none overflow-hidden text-left transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'border-2 border-taupe shadow-xs'
                : 'border-2 border-line hover:border-taupe/60 opacity-90 hover:opacity-100 shadow-2xs'
            }`}
          >
            {/* Top: Model or Fabric Image Box (sharp corners, no border radius) */}
            <div className="relative w-full aspect-square bg-sunken rounded-none overflow-hidden">
              {currentThumb ? (
                <Image
                  src={getMediaUrl(currentThumb)}
                  alt={`${opt.name} ${isFabricActive ? 'fabric' : 'model'}`}
                  fill
                  sizes="84px"
                  className="object-cover object-top transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: opt.hex }}
                />
              )}
            </div>

            {/* Bottom: Literal Color bar with text inside (sharp corners, no border radius) */}
            <div
              className="w-full py-1.5 px-1 text-center border-t border-black/15 rounded-none shrink-0"
              style={{ backgroundColor: opt.hex }}
            >
              <span
                className="block text-[11px] font-semibold leading-tight capitalize truncate"
                style={{ color: textColor }}
                title={opt.name}
              >
                {opt.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
