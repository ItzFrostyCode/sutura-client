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
    <header className="sticky top-0 z-40 bg-surface border-b border-line px-3 py-3 shadow-xs">
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-full text-ink hover:bg-sunken active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 flex items-center gap-2 bg-sunken rounded-full px-3.5 py-2 border border-line focus-within:border-taupe focus-within:bg-white transition-all">
          <MapPin size={17} className="text-taupe shrink-0" />
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
              className="text-ink-faint hover:text-ink shrink-0 cursor-pointer"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void onSearch()}
              aria-label="Search"
              className="text-ink-faint hover:text-taupe shrink-0 cursor-pointer"
            >
              <SearchIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-3 max-w-lg mx-auto">
        {(['recent', 'suggested'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all shrink-0 cursor-pointer ${
              activeTab === tab
                ? 'bg-taupe text-white shadow-xs'
                : 'bg-sunken text-ink-muted hover:text-ink hover:bg-line/40'
            }`}
          >
            {tab === 'recent' ? 'Recent' : 'Suggested'}
          </button>
        ))}
      </div>
    </header>
  );
}
