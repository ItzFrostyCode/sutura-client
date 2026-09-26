'use client';

import React from 'react';
import { Check } from 'lucide-react';
import {
  COLOR_FAMILIES,
  ColorFamily,
  parseSelectedColors,
  toggleColorSelection,
  toggleFamilySelection,
} from '@/lib/colorFamilies';

interface ColorFamilyFilterSectionProps {
  readonly selectedColor: string;
  readonly onColorChange: (val: string) => void;
  readonly className?: string;
}

export default function ColorFamilyFilterSection({
  selectedColor,
  onColorChange,
  className = '',
}: ColorFamilyFilterSectionProps) {
  const selectedList = parseSelectedColors(selectedColor);

  return (
    <div className={`space-y-3 ${className}`}>
      {COLOR_FAMILIES.map((family: ColorFamily) => {
        const familySelectedCount = family.colors.filter((c) =>
          selectedList.some((sc) => sc.toLowerCase() === c.label.toLowerCase())
        ).length;
        const allFamilySelected = familySelectedCount === family.colors.length;

        return (
          <div key={family.name} className="space-y-1.5 pb-2.5 border-b border-line/40 last:border-b-0 last:pb-0">
            {/* Family Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onColorChange(toggleFamilySelection(selectedColor, family))}
                className="flex items-center gap-1.5 text-left group cursor-pointer"
                title={allFamilySelected ? `Deselect all ${family.name}` : `Select all in ${family.name}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: family.dotColor }}
                />
                <span className="text-[11px] font-bold text-[#524A44] group-hover:text-[#2D2A26] transition-colors">
                  {family.name}
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                {familySelectedCount > 0 && (
                  <span className="text-[10px] font-bold text-taupe px-1.5 py-0.2 bg-[#F5F1EC] rounded-full">
                    {familySelectedCount} selected
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onColorChange(toggleFamilySelection(selectedColor, family))}
                  className="text-[10px] text-ink-muted hover:text-ink hover:underline cursor-pointer"
                >
                  {allFamilySelected ? 'clear' : 'all'}
                </button>
              </div>
            </div>

            {/* Individual Sub-color Pills */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {family.colors.map((c) => {
                const isSelected = selectedList.some((sc) => sc.toLowerCase() === c.label.toLowerCase());

                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => onColorChange(toggleColorSelection(selectedColor, c.label))}
                    className={`flex items-center gap-1.5 px-2 py-1 border text-[11px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D2A26] text-white border-[#2D2A26] font-semibold shadow-xs'
                        : 'bg-white text-[#2D2A26] border-[#D1C7BD] hover:border-[#9A8073]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.label}</span>
                    {isSelected && <Check size={11} className="text-white shrink-0 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
