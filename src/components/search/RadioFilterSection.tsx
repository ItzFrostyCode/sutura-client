'use client';

import { ChevronDown, Check } from 'lucide-react';

/**
 * One collapsible single-select radio list — shared shell for the
 * Department/Subcategory/Garment Structure/Garment Type cascade used by
 * both SearchWebFilterSidebar (desktop) and SearchFilterDrawer (mobile).
 * Same visual pattern (checkbox-style radio row) the rest of both already
 * use for Rating/District, just parameterized.
 */
export default function RadioFilterSection({
  title,
  sectionKey,
  isOpen,
  onToggle,
  options,
  selected,
  onSelect,
  allLabel,
}: Readonly<{
  title: string;
  sectionKey: string;
  isOpen: boolean;
  onToggle: (key: string) => void;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  allLabel: string;
}>) {
  return (
    <div className="border-b border-[#EBE6E0]">
      <div
        onClick={() => onToggle(sectionKey)}
        className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {selected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selected);
              }}
              className="text-[10px] font-semibold text-[#9A8073] hover:text-[#2D2A26] hover:underline cursor-pointer lowercase"
            >
              (all)
            </button>
          )}
          <ChevronDown
            size={13}
            className={`text-[#827A73] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
      {isOpen && (
        <div className="divide-y divide-[#F5F1EC] bg-white">
          <button
            type="button"
            onClick={() => selected && onSelect(selected)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
              !selected ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                !selected ? 'bg-[#2D2A26] border-[#2D2A26] text-white' : 'bg-white border-[#D1C7BD] group-hover:border-[#827A73]'
              }`}
            >
              {!selected && <Check size={10} strokeWidth={3.5} className="text-white" />}
            </span>
            <span className="truncate">{allLabel}</span>
          </button>
          {options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                  isSelected ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#2D2A26] border-[#2D2A26] text-white'
                      : 'bg-white border-[#D1C7BD] group-hover:border-[#827A73]'
                  }`}
                >
                  {isSelected && <Check size={10} strokeWidth={3.5} className="text-white" />}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
