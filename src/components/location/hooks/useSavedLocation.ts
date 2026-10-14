'use client';

import { useEffect, useState } from 'react';
import { LOCATION_CHANGED_EVENT, getSavedLocation, type SavedLocation } from '@/lib/customerLocation';

/** The place the visitor is browsing from, as saved on this device — and kept up to date when they change it. Never asks the browser for it. */
export function useSavedLocation(): SavedLocation | null {
  const [location, setLocation] = useState<SavedLocation | null>(null);

  useEffect(() => {
    setLocation(getSavedLocation());
    const onChange = (e: Event) => {
      const loc = (e as CustomEvent<SavedLocation>).detail;
      if (loc) setLocation(loc);
    };
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);

  return location;
}
