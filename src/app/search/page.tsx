'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import SearchMapView from '@/components/search/map/SearchMapView';

// One full-screen page that never scrolls: the map fills everything and the bottom navigation floats over it.
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-canvas">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      }
    >
      <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
        <PublicNav isSticky={false} />
        <SearchMapView />
      </div>
    </Suspense>
  );
}
