'use client';

import React, { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, X, Search as SearchIcon } from 'lucide-react';
import { lastPage } from '@/lib/lastPage';

interface LocationHeaderProps {
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly searchQuery: string;
  readonly setSearchQuery: (val: string) => void;
  readonly onSearch: () => void;
  readonly onClearSearch: () => void;
  /** The page that opened this screen (`returnTo`); empty when it was opened directly. */
  readonly backHref: string;
}

export default function LocationHeader({ searchInputRef, searchQuery, setSearchQuery, onSearch, onClearSearch, backHref }: LocationHeaderProps) {
  const router = useRouter();
  // Back goes to the page that opened this one (`returnTo`); with none given, to the last real page the person was on (never a
  // detour such as the map), and failing that the landing page. Browser history is not used: its "previous page" could be the
  // map, whose Back led straight back here.
  const goBack = () => router.push(backHref || lastPage() || '/');

  return (
    <header className="sticky top-0 z-40 bg-canvas px-6 pb-3 pt-4 sm:px-10">
      <div className="mx-auto max-w-[560px]">
        <div className="flex h-14 items-center gap-1 rounded-full border border-line/60 bg-surface pl-2 pr-2 shadow-[0_1px_2px_rgba(45,42,38,0.04),0_8px_24px_rgba(45,42,38,0.06)] transition-colors focus-within:border-line-strong">
          <button type="button" onClick={goBack} aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-sunken">
            <ArrowLeft size={20} />
          </button>
          <MapPin size={20} className="shrink-0 text-taupe" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void onSearch(); }}
            placeholder="Search a place in Davao"
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-base text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            type="button"
            onClick={searchQuery ? onClearSearch : () => void onSearch()}
            aria-label={searchQuery ? 'Clear search' : 'Search'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sunken hover:text-ink"
          >
            {searchQuery ? <X size={18} /> : <SearchIcon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
