'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';

interface StoreDirectoryHeaderProps {
  q: string;
  setQ: (val: string) => void;
}

// Filter controls (district, specialization, open-now, sort, near-me) were
// removed by request — search-only header now, no icon-toggled panel.
export default function StoreDirectoryHeader({ q, setQ }: Readonly<StoreDirectoryHeaderProps>) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="max-w-5xl mx-auto w-full">
        {/* Mobile (<sm): stacked — back + centered title row, full-width
            search below. Tablet/desktop (sm+): single row — back + title
            on the left, search filling the remaining width on the right —
            the stacked mobile layout had no breakpoint at all, so it just
            stretched edge-to-edge and looked like an oversized phone header
            on a wide viewport. */}
        <div className="h-[52px] sm:h-14 flex items-center px-1 sm:px-4 gap-1 sm:gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="btn-icon-mobile text-ink hover:text-taupe touch-target-48 shrink-0"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Title — single H1 per screen view. Centered on mobile (needs
              the spacer below to balance the back button); left-aligned,
              fixed-width on sm+ so it doesn't fight the search bar for space. */}
          <h1 className="flex-1 sm:flex-none text-center sm:text-left mobile-h4 sm:text-lg font-semibold text-ink">
            All Stores
          </h1>

          <div className="w-12 shrink-0 sm:hidden" aria-hidden="true" />

          <div className="hidden sm:block flex-1">
            <SearchInput
              id="stores-search-input-desktop"
              value={q}
              onChange={setQ}
              placeholder="Search store name..."
              className="w-full"
            />
          </div>
        </div>

        <div className="px-3 pb-3 sm:hidden">
          <SearchInput
            id="stores-search-input"
            value={q}
            onChange={setQ}
            placeholder="Search store name..."
            className="w-full"
          />
        </div>
      </div>
    </header>
  );
}
