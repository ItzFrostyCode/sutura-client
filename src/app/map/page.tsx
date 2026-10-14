'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChooseLocationScreen from '@/components/map/ChooseLocationScreen';

export default function MapPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">Loading map…</div>}>
      <MapPageContent />
    </Suspense>
  );
}

// `/map?select=1` is the "Choose on map" screen (choose a place). Browsing shops on a map is /search, so every other /map link goes there.
function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSelectMode = searchParams.get('select') === '1' || searchParams.get('mode') === 'select' || searchParams.get('mode') === 'map';

  useEffect(() => {
    if (isSelectMode) return;
    const params = new URLSearchParams();
    const text = searchParams.get('q');
    const district = searchParams.get('district');
    if (text) params.set('q', text);
    if (district) params.set('district', district);
    router.replace(params.toString() ? `/search?${params.toString()}` : '/search');
  }, [isSelectMode, router, searchParams]);

  if (!isSelectMode) return <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">Opening map…</div>;
  return <ChooseLocationScreen />;
}
