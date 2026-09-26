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
      <div className="h-[52px] sm:h-[56px] flex items-center px-1 sm:px-3 gap-1">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="btn-icon-mobile text-ink hover:text-taupe touch-target-48"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Title — single H1 per screen view */}
        <h1 className="flex-1 text-center mobile-h4 font-semibold text-ink">All Stores</h1>

        {/* Spacer so the title stays visually centered against the back button */}
        <div className="w-12 shrink-0" aria-hidden="true" />
      </div>

      <div className="px-3 pb-3">
        <SearchInput
          id="stores-search-input"
          value={q}
          onChange={setQ}
          placeholder="Search store name..."
          className="w-full"
        />
      </div>
    </header>
  );
}
