'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, LocateFixed, MapPinOff } from 'lucide-react';
import type { SavedLocation } from '@/lib/customerLocation';
import type { LocationStatus } from './useHomeData';

/**
 * Formats a location object into a complete, human-readable address structure
 * (e.g., "Buhangin, Davao City, Davao del Sur") instead of only the district name.
 */
export function formatFullLocationAddress(
  loc: SavedLocation & { formatted_address?: string; display_name?: string }
): string {
  const rawAddr = (
    loc.formatted_address ||
    loc.display_name ||
    loc.address ||
    ''
  ).trim();
  const district = (loc.district || '').trim();

  if (!rawAddr && !district) {
    return 'Davao City, Davao del Sur';
  }

  // Pure coordinates check e.g. "7.1106, 125.6119"
  const isCoords = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(rawAddr);
  if (isCoords) {
    // No place name yet: show the district if it's more specific than the
    // city itself (avoids "Davao City, Davao City, Davao del Sur").
    return district && !/^davao( city)?$/i.test(district)
      ? `${district}, Davao City, Davao del Sur`
      : 'Davao City, Davao del Sur';
  }

  let full = rawAddr || district;

  // Clean trailing country if present to keep it punchy and local
  full = full.replace(/,\s*Philippines$/i, '').trim();

  const lower = full.toLowerCase();

  // If already contains province "Davao del Sur"
  if (lower.includes('davao del sur')) {
    return full;
  }

  // If contains "Davao City" but not "Davao del Sur"
  if (lower.includes('davao city')) {
    return `${full}, Davao del Sur`;
  }

  // Neither "Davao City" nor "Davao del Sur" present
  const parts: string[] = [full];
  if (district && !lower.includes(district.toLowerCase())) {
    parts.push(district);
  }
  parts.push('Davao City', 'Davao del Sur');

  return parts.join(', ');
}

/**
 * The hero's "where are you" line: detecting → found (with a way to change
 * it) → declined (with a way to set it by hand). aria-live so a screen reader
 * hears the result when detection finishes.
 */
export default function HomeLocationStatus({
  status,
  location,
}: {
  readonly status: LocationStatus;
  readonly location: SavedLocation | null;
}) {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentDateTime(`As of ${datePart} • ${timePart}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30_000);
    return () => clearInterval(interval);
  }, []);

  const chipBase =
    'inline-flex min-h-9 items-center border border-white/25 bg-black/35 px-3.5 py-1.5 text-xs sm:text-sm text-white backdrop-blur-md shadow-sm transition-all';

  const fullAddress = location ? formatFullLocationAddress(location) : '';

  return (
    <div aria-live="polite" className="mb-5 flex justify-center">
      {status === 'locating' && (
        <span className={`${chipBase} gap-2`}>
          <Loader2 size={15} className="animate-spin text-[#E8D9C9]" aria-hidden="true" />
          Pinpointing your location…
        </span>
      )}

      {status === 'ready' && location && (
        <div
          className={`${chipBase} max-w-[calc(100vw-2rem)] flex-col sm:flex-row gap-1 sm:gap-2.5 py-2 sm:py-1.5 justify-center`}
        >
          {/* Location details */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-full">
            <LocateFixed size={15} className="shrink-0 text-[#E8D9C9]" aria-hidden="true" />
            <span
              title={fullAddress}
              className="truncate max-w-[15rem] xs:max-w-[18rem] sm:max-w-xs md:max-w-md lg:max-w-xl font-normal leading-tight"
            >
              {/* The Davao City fallback isn't the visitor's spot — say "around", not "near". */}
              {location.isDefault ? 'Showing shops around ' : 'Showing shops near '}
              <strong className="font-semibold text-white">{fullAddress}</strong>
            </span>
          </div>

          {/* Desktop divider */}
          <span className="hidden sm:inline text-white/40 select-none" aria-hidden="true">
            •
          </span>

          {/* Timestamp and Change Action */}
          <div className="flex items-center gap-2 shrink-0 text-white/90 text-[11px] sm:text-xs">
            {currentDateTime && (
              <span className="text-white/80 whitespace-nowrap" suppressHydrationWarning>
                {currentDateTime}
              </span>
            )}
            <span className="text-white/40 select-none" aria-hidden="true">
              •
            </span>
            <Link
              href="/location"
              className="font-semibold text-white underline underline-offset-2 hover:text-[#E8D9C9] transition-colors whitespace-nowrap"
            >
              {location.isDefault ? 'Set my location' : 'Change'}
            </Link>
          </div>
        </div>
      )}

      {status === 'denied' && (
        <span className={`${chipBase} gap-2`}>
          <MapPinOff size={15} className="text-[#E8D9C9]" aria-hidden="true" />
          Location is off
          <Link
            href="/location"
            className="font-semibold underline underline-offset-2 hover:text-[#E8D9C9]"
          >
            Set it manually
          </Link>
        </span>
      )}
    </div>
  );
}
