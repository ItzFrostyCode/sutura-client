'use client';

import React from 'react';
import { X } from 'lucide-react';
import OverlayPortal from '@/components/shared/OverlayPortal';
import { useScrollLock } from '@/hooks/useScrollLock';

interface CatalogFilterSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly activeFiltersCount: number;
  readonly onResetAll: () => void;
  readonly resultCount: number;
  readonly children: React.ReactNode;
}

// Phone-only full-screen filter panel: starts at the top and is fully opaque,
// so nothing from the page shows through. Filters apply live, so "Show N
// designs" just closes it. Edge-to-edge at every width it shows (below 768px) — no side margins.
export default function CatalogFilterSheet({
  isOpen,
  onClose,
  activeFiltersCount,
  onResetAll,
  resultCount,
  children,
}: Readonly<CatalogFilterSheetProps>) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <OverlayPortal>
    <div role="dialog" aria-modal="true" aria-label="Filters" className="md:hidden fixed inset-0 z-[100] bg-surface overflow-hidden">
      <div className="h-dvh w-full flex flex-col">
        <div className="flex items-center justify-between pl-4 pr-1 min-h-14 bg-ink text-white shrink-0">
          <h2 className="text-base font-semibold">Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center text-white cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        <div className="flex gap-3 p-4 border-t border-line shrink-0 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onResetAll}
            disabled={activeFiltersCount === 0}
            className="h-12 px-5 border border-line-strong text-sm font-medium text-ink disabled:opacity-40 cursor-pointer"
          >
            Reset
          </button>
          <button type="button" onClick={onClose} className="flex-1 h-12 bg-ink text-white text-sm font-semibold cursor-pointer">
            Show {resultCount} {resultCount === 1 ? 'design' : 'designs'}
          </button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  );
}
