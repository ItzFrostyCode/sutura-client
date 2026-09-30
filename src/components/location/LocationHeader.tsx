'use client';

import React, { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, X, Search as SearchIcon } from 'lucide-react';

interface LocationHeaderProps {
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly searchQuery: string;
  readonly setSearchQuery: (val: string) => void;
  readonly onSearch: () => void;
  readonly onClearSearch: () => void;
  readonly activeTab: 'recent' | 'suggested';
  readonly setActiveTab: (tab: 'recent' | 'suggested') => void;
}

export default function LocationHeader({
  searchInputRef,
  searchQuery,
  setSearchQuery,
  onSearch,
  onClearSearch,
  activeTab,
  setActiveTab,
}: LocationHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line px-3 sm:px-6 py-3 sm:py-3.5 shadow-2xs">
      <div className="max-w-xl mx-auto">
        {/* Unified Search Input with Integrated Back Button (No isolated box) */}
        <div className="flex items-center gap-2 bg-surface h-11 pl-2 pr-3.5 border border-line focus-within:border-ink focus-within:ring-1 focus-within:ring-ink transition-all rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="w-9 h-9 flex items-center justify-center text-ink hover:text-taupe hover:bg-sunken active:bg-sunken rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="w-px h-4 bg-line shrink-0" />

          <MapPin size={17} className="text-taupe shrink-0 ml-0.5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onSearch();
            }}
            placeholder="Ateneo de Davao, Agdao, Bajada..."
            className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              className="text-ink-faint hover:text-ink shrink-0 cursor-pointer p-1 rounded-md hover:bg-sunken"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void onSearch()}
              aria-label="Search"
              className="text-ink-faint hover:text-taupe shrink-0 cursor-pointer p-1 rounded-md hover:bg-sunken"
            >
              <SearchIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs with smooth corner radius */}
      <div className="flex items-center gap-2 mt-3 max-w-xl mx-auto">
        {(['recent', 'suggested'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer border rounded-lg ${
              activeTab === tab
                ? 'bg-taupe text-white border-taupe shadow-2xs'
                : 'bg-surface border-line text-ink-muted hover:text-ink hover:bg-sunken'
            }`}
          >
            {tab === 'recent' ? 'Recent' : 'Suggested'}
          </button>
        ))}
      </div>
    </header>
  );
}
