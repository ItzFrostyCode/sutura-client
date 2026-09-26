'use client';

import { Suspense } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import StoreCard from '@/components/stores/StoreCard';
import StoreDirectoryHeader from '@/components/stores/StoreDirectoryHeader';
import { useStoreDirectory } from '@/components/stores/useStoreDirectory';
import { groupStoresByLetter } from '@/components/stores/storesTypes';

export default function StoresDirectoryPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center text-sm text-ink-muted">Loading…</div>}>
      <StoresDirectoryContent />
    </Suspense>
  );
}

function StoresDirectoryContent() {
  const {
    q, setQ,
    sortBy,
    page, setPage,
    stores, total, lastPage, loading,
    userLocation, locationError, setLocationError,
  } = useStoreDirectory();

  return (
    <div className="min-h-full flex flex-col bg-canvas">
      <StoreDirectoryHeader q={q} setQ={setQ} />

      <main className="flex-1 w-full max-w-5xl mx-auto mobile-screen-margins py-4">
        {locationError && (
          <div className="flex items-start gap-2 mb-4 text-xs text-danger bg-danger/5 border border-danger/20 px-3 py-2.5 rounded-lg">
            <span className="flex-1">{locationError}</span>
            <button
              type="button"
              onClick={() => setLocationError('')}
              aria-label="Dismiss"
              className="touch-target-44 -mr-2 -my-2 text-danger"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {userLocation && (
          <p className="mobile-caption text-ink-faint mb-3 font-normal">
            Sorted by distance from your current location.
          </p>
        )}

        {loading && <div className="text-center py-16 mobile-body-sm text-ink-muted">Loading stores…</div>}

        {!loading && stores.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl p-8 sm:p-10 text-center mobile-body-sm text-ink-muted">
            No stores matched your search.
          </div>
        )}

        {!loading && stores.length > 0 && (
          <>
            <p className="mobile-caption text-ink-faint mb-3 font-normal">
              {total} store{total === 1 ? '' : 's'}
            </p>

            {sortBy === 'name_asc' && !userLocation ? (
              groupStoresByLetter(stores).map(([letter, group]) => (
                <div key={letter} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-taupe text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {letter}
                    </span>
                    <div className="h-px flex-1 bg-line" />
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,284px))] gap-3">
                    {group.map((store) => <StoreCard key={store.id} store={store} />)}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,284px))] gap-3">
                {stores.map((store) => <StoreCard key={store.id} store={store} />)}
              </div>
            )}

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
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
    </div>
  );
}
