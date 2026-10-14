'use client';

import type { Ref } from 'react';
import { Search, Settings2, X } from 'lucide-react';

interface SearchPillProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onOpenFilter: () => void;
  readonly activeFilterCount: number;
  readonly onClear?: () => void;
  readonly inputRef?: Ref<HTMLInputElement>;
  /** Taller on wider screens (the landing page). */
  readonly large?: boolean;
  /** A slimmer 48px bar (the search screen). */
  readonly slim?: boolean;
}

/** Rounded search bar with the filter icon inside it, after a thin divider. */
export default function SearchPill({ value, onChange, onSubmit, onOpenFilter, activeFilterCount, onClear, inputRef, large = false, slim = false }: SearchPillProps) {
  return (
    <form onSubmit={onSubmit} role="search" className={`flex items-center rounded-full border border-line/60 bg-surface shadow-[0_1px_2px_rgba(45,42,38,0.04),0_8px_24px_rgba(45,42,38,0.06)] transition-colors focus-within:border-line-strong ${slim ? 'h-12 pl-4' : `h-14 pl-5 ${large ? 'sm:h-16 sm:pl-6' : ''}`}`}>
      <Search size={slim ? 20 : 24} className="shrink-0 text-ink-faint" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="what are you looking for?"
        aria-label="Search garments, services or shops"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-base text-ink placeholder:text-ink-faint focus:outline-none"
      />
      {onClear && value && (
        <button type="button" onClick={onClear} aria-label="Clear search" className="touch-target-44 flex shrink-0 items-center justify-center text-ink-faint hover:text-ink">
          <X size={16} />
        </button>
      )}
      <span aria-hidden="true" className="h-8 w-px shrink-0 bg-line-strong" />
      <button
        type="button"
        onClick={onOpenFilter}
        aria-label={activeFilterCount > 0 ? `Filter, ${activeFilterCount} active` : 'Filter'}
        className={`relative flex h-full shrink-0 items-center justify-center rounded-r-full text-ink transition-colors hover:text-taupe ${slim ? 'w-12' : 'w-14'}`}
      >
        <Settings2 size={slim ? 20 : 24} />
        {activeFilterCount > 0 && <span className={`absolute h-2.5 w-2.5 rounded-full bg-taupe ${slim ? 'right-2.5 top-2.5' : 'right-3 top-3'}`} />}
      </button>
    </form>
  );
}
