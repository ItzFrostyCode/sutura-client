'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { rememberPage } from '@/lib/lastPage';

/** Remembers the page the person is on, so a detour (choosing a place) can lead Back to where they were. Renders nothing. */
export default function LastPageTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    rememberPage(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search]);

  return null;
}
