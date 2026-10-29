'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LocationBar from '@/components/home/LocationBar';
import { LOCATION_CHANGED_EVENT, getSavedLocation, type SavedLocation } from '@/lib/customerLocation';

/** The same top strip as the landing page (address, date and time on one row), for the search and map screen. */
export default function SearchLocationBar() {
  const pathname = usePathname() ?? '/search';
  const query = useSearchParams().toString();
  const [location, setLocation] = useState<SavedLocation | null>(null);

  useEffect(() => {
    setLocation(getSavedLocation());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<SavedLocation>).detail;
      if (detail) setLocation(detail);
    };
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);

  const here = `${pathname}${query ? `?${query}` : ''}`;
  return <LocationBar location={location} changeHref={`/location?returnTo=${encodeURIComponent(here)}`} />;
}
