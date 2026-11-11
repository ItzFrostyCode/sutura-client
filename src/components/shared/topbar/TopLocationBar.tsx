'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LocationBar from '@/components/home/LocationBar';
import { LOCATION_CHANGED_EVENT, getSavedLocation, type SavedLocation } from '@/lib/customerLocation';

/**
 * The location strip for every page that has PublicTopBar: the saved place (updated live when it changes anywhere,
 * e.g. the landing page finding the visitor), and "Change" back to this exact page afterwards.
 * Reads the query from `window.location` (not useSearchParams) so a static page needs no Suspense boundary for it.
 */
export default function TopLocationBar() {
  const pathname = usePathname() ?? '/';
  const [location, setLocation] = useState<SavedLocation | null>(null);
  // Until the saved place is read, the strip stays blank (same height) instead of saying "Davao City" and then
  // swapping to the real address.
  const [ready, setReady] = useState(false);
  const [here, setHere] = useState(pathname);

  useEffect(() => {
    setLocation(getSavedLocation());
    setReady(true);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<SavedLocation>).detail;
      if (detail) setLocation(detail);
    };
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    setHere(`${pathname}${window.location.search}`);
  }, [pathname]);

  return <LocationBar location={location} ready={ready} changeHref={`/location?returnTo=${encodeURIComponent(here)}`} />;
}
