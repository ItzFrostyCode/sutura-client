'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import PageBrandRow from '@/components/shared/publicNav/PageBrandRow';
import HomeFooter from '@/components/home/HomeFooter';
import DirectorySearchBar from '@/components/shared/DirectorySearchBar';
import StoreCard from '@/components/stores/StoreCard';
import { useStoreDirectory } from '@/components/stores/useStoreDirectory';

export default function ShopsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-sm text-ink-muted">
          Loading shops…
        </div>
      }
    >
      <ShopsDirectoryContent />
    </Suspense>
  );
}

function ShopsDirectoryContent() {
  const {
    q,
    setQ,
    page,
    setPage,
    stores,
    total,
    lastPage,
    loading,
    locationError,
    setLocationError,
  } = useStoreDirectory();

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* Sticky Top Navigation Bar */}
      <div className="sticky top-0 z-50">
        <PublicNav isSticky={false} />
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto mobile-screen-margins py-6 sm:py-8">
        <PageBrandRow className="mb-2" />

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mobile-caption text-ink-muted flex items-center gap-1.5 mb-4">
          <Link href="/" className="hover:text-ink transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-ink font-semibold">All Shops</span>
        </nav>

        {/* Page Title & Subtitle */}
        <div className="mb-6">
          <h1 className="mobile-h1 sm:tablet-h1 text-ink mb-2">All Shops</h1>
          <p className="mobile-body-md text-ink-muted max-w-2xl">
            Discover every tailoring shop across SUTURA in Davao City.
          </p>
        </div>

        {/* Search Bar - Landing page rounded style with generous height, no filter */}
        <DirectorySearchBar
          value={q}
          onChange={setQ}
          placeholder="Search shops by name, specialty, or district in Davao City..."
          ariaLabel="Search tailoring shops in Davao City"
          className="mb-8"
        />

        {locationError && (
          <div className="flex items-start gap-2 mb-6 text-xs text-danger bg-danger/5 border border-danger/20 px-3.5 py-2.5 rounded-xl">
            <span className="flex-1">{locationError}</span>
            <button
              type="button"
              onClick={() => setLocationError('')}
              aria-label="Dismiss error"
              className="touch-target-44 -mr-2 -my-2 text-danger hover:opacity-80"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16 mobile-body-sm text-ink-muted">
            Loading shops…
          </div>
        )}

        {/* Empty State */}
        {!loading && stores.length === 0 && (
          <div className="py-12 text-center bg-surface border border-line rounded-xl sm:rounded-2xl shadow-2xs">
            <p className="text-ink text-base font-medium">
              No shops match &ldquo;{q}&rdquo;
            </p>
            <p className="text-ink-muted text-xs mt-1">
              Try searching for a different shop name, specialty, or Davao district.
            </p>
          </div>
        )}

        {/* Shops Directory Grid (Clean direct grid, no category carousel, no A-Z bar) */}
        {!loading && stores.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs sm:text-sm text-ink-muted font-medium">
                {total} shop{total === 1 ? '' : 's'} available
              </span>
            </div>

            {/* Responsive Store Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>

            {/* Pagination Controls */}
            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="touch-target-44 p-2 rounded-lg border border-line text-ink-muted hover:bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="mobile-caption text-ink-muted px-2 font-normal">
                  Page {page} of {lastPage}
                </span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="touch-target-44 p-2 rounded-lg border border-line text-ink-muted hover:bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}
