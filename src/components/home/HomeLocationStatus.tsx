'use client';

import Link from 'next/link';
import { Loader2, LocateFixed, MapPinOff } from 'lucide-react';
import type { SavedLocation } from '@/lib/customerLocation';
import type { LocationStatus } from './useHomeData';

/**
 * The hero's "where are you" line: detecting → found (with a way to change
 * it) → declined (with a way to set it by hand). aria-live so a screen reader
 * hears the result when detection finishes.
 */
export default function HomeLocationStatus({ status, location }: { readonly status: LocationStatus; readonly location: SavedLocation | null }) {
  const chip = 'inline-flex min-h-9 items-center gap-2 border border-white/25 bg-black/30 px-3 py-1.5 text-xs sm:text-sm text-white backdrop-blur-sm';

  return (
    <div aria-live="polite" className="mb-5 flex justify-center">
      {status === 'locating' && (
        <span className={chip}>
          <Loader2 size={15} className="animate-spin text-[#E8D9C9]" aria-hidden="true" />
          Pinpointing your location…
        </span>
      )}

      {status === 'ready' && location && (
        <span className={chip}>
          <LocateFixed size={15} className="text-[#E8D9C9]" aria-hidden="true" />
          <span className="max-w-[16rem] truncate sm:max-w-sm">Showing shops near {location.district || location.address}</span>
          <Link href="/location" className="font-semibold underline underline-offset-2 hover:text-[#E8D9C9]">Change</Link>
        </span>
      )}

      {status === 'denied' && (
        <span className={chip}>
          <MapPinOff size={15} className="text-[#E8D9C9]" aria-hidden="true" />
          Location is off
          <Link href="/location" className="font-semibold underline underline-offset-2 hover:text-[#E8D9C9]">Set it manually</Link>
        </span>
      )}
    </div>
  );
}
