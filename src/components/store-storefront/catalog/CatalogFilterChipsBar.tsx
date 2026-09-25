import React from 'react';
import { X } from 'lucide-react';

export interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface CatalogFilterChipsBarProps {
  readonly totalCount: number;
  readonly activeFilterChips: FilterChip[];
  readonly onClearAll: () => void;
  readonly showPortfolioFabric: boolean;
  readonly onTogglePortfolioFabric: () => void;
}

export default function CatalogFilterChipsBar({
  totalCount,
  activeFilterChips,
  onClearAll,
  showPortfolioFabric,
  onTogglePortfolioFabric,
}: CatalogFilterChipsBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        <span className="mobile-caption text-ink-muted whitespace-nowrap shrink-0">
          Showing {totalCount} designs.
        </span>
        {activeFilterChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={chip.onRemove}
            className="flex items-center gap-1 border border-line bg-canvas px-2.5 py-1 rounded-full text-xs font-medium text-ink-body hover:border-taupe hover:text-taupe transition-colors shrink-0 cursor-pointer"
          >
            <span>{chip.label}</span>
            <X size={12} />
          </button>
        ))}
        {activeFilterChips.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-taupe hover:underline ml-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[32px] flex items-center"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Model / Fabric toggle */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <span className={`text-xs font-medium ${!showPortfolioFabric ? 'text-ink' : 'text-ink-faint'}`}>
          Model
        </span>
        <button
          type="button"
          onClick={onTogglePortfolioFabric}
          aria-label="Toggle between model and fabric photos"
          className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
            showPortfolioFabric ? 'bg-ink' : 'bg-line-strong'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              showPortfolioFabric ? 'translate-x-4' : ''
            }`}
          />
        </button>
        <span className={`text-xs font-medium ${showPortfolioFabric ? 'text-ink' : 'text-ink-faint'}`}>
          Fabric
        </span>
      </div>
    </div>
  );
}
