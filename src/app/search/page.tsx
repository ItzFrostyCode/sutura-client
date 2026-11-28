'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SearchMapView from '@/components/search/map/SearchMapView';
import FeatureNav from '@/components/shared/FeatureNav';

// One full-screen page that never scrolls: the shared top bar (same as Discover and Track Order), then the map filling
// the rest, with the bottom navigation floating over it on phones and tablets.
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-canvas">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      }
    >
      {/* Same frame as the old /map page: the map edge to edge, the feature bar floating over it (map-fullscreen, globals.css). */}
      <div className="map-fullscreen flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
        <FeatureNav />
        {/* The page's one H1 (the map has no visible title; screen readers and the outline still need one). */}
        <h1 className="sr-only">Find a tailoring shop on the map of Davao City</h1>
        <SearchMapView />
      </div>
    </Suspense>
  );
}
