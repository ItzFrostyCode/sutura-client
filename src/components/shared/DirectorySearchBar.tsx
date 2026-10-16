'use client';

import { Search, X } from 'lucide-react';

interface DirectorySearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit?: (e: React.FormEvent) => void;
  readonly placeholder?: string;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * Clean search input matching the landing page search bar's height,
 * rounded-full corner radius, and subtle shadow, without the filter toggle.
 */
export default function DirectorySearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  ariaLabel = 'Search',
  className = '',
}: DirectorySearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
      role="search"
      className={`flex items-center rounded-full border border-line/60 bg-surface shadow-[0_1px_2px_rgba(45,42,38,0.04),0_8px_24px_rgba(45,42,38,0.06)] transition-colors focus-within:border-line-strong h-14 pl-5 sm:h-16 sm:pl-6 pr-4 sm:pr-5 ${className}`}
    >
      <Search size={22} className="shrink-0 text-ink-faint" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm sm:text-base text-ink placeholder:text-ink-faint focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="touch-target-44 flex shrink-0 items-center justify-center text-ink-faint hover:text-ink cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </form>
  );
}
