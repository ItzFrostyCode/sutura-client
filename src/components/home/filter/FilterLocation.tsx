'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { LOCATION_CHANGED_EVENT, getSavedLocation, isApproximate, type SavedLocation } from '@/lib/customerLocation';

/**
 * "Shops near …" inside the Filter pop-up on the Map. The map screen has no location strip on top (the space goes to
 * the map and the list), so where distances are measured from lives with the other things that narrow the shops.
 */
export default function FilterLocation({ returnTo = '/search' }: Readonly<{ returnTo?: string }>) {
  const [loc, setLoc] = useState<SavedLocation | null>(null);
  useEffect(() => {
    setLoc(getSavedLocation());
    const onChange = (e: Event) => { const d = (e as CustomEvent<SavedLocation>).detail; if (d) setLoc(d); };
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);
  const rough = isApproximate(loc);

  return (
    <section>
      <h3 className="mobile-h4 mb-3 text-ink">Location</h3>
      <div className="flex items-center gap-3 rounded-2xl bg-sunken p-3">
        <MapPin size={20} className="shrink-0 text-taupe-dark" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="mobile-body-sm text-ink-muted">{rough ? 'Near (approximate)' : 'Shops near'}</p>
          <p className="mobile-body-sm line-clamp-2 font-medium text-ink">{loc?.address || 'Davao City'}</p>
        </div>
        <Link href={`/location?returnTo=${encodeURIComponent(returnTo)}`} className="flex h-11 shrink-0 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:border-ink">
          {rough ? 'Set exact spot' : 'Change'}
        </Link>
      </div>
    </section>
  );
}
