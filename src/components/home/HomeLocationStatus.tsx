'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, MapPinOff } from 'lucide-react';
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
 * "Where are you" in the site header: detecting -> found (with Change) ->
 * declined (with a way to set it by hand). Two layouts:
 *  - header: the empty top-left of the desktop header, address over "As of ... · Change".
 *  - bar: one slim row under the phone header (no room beside the menu button).
 * aria-live so a screen reader hears the result when detection finishes.
 */
export default function HomeLocationStatus({
  status,
  location,
  variant = 'header',
}: {
  readonly status: LocationStatus;
  readonly location: SavedLocation | null;
  readonly variant?: 'header' | 'bar';
}) {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timePart = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setCurrentDateTime(`As of ${datePart} • ${timePart}`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 30_000);
    return () => clearInterval(interval);
  }, []);

  const bar = variant === 'bar';
  const iconSize = bar ? 16 : 18;
  const linkClass =
    'font-semibold text-ink underline underline-offset-2 hover:text-taupe transition-colors whitespace-nowrap';

  let icon: React.ReactNode;
  let main: React.ReactNode;
  let link: React.ReactNode = null;

  if (status === 'locating') {
    icon = <Loader2 size={iconSize} className="shrink-0 animate-spin text-taupe" aria-hidden="true" />;
    main = <span className="text-ink-muted">Pinpointing your location…</span>;
  } else if (status === 'denied' || !location) {
    icon = <MapPinOff size={iconSize} className="shrink-0 text-taupe" aria-hidden="true" />;
    main = <span className="font-semibold text-ink">Location is off</span>;
    link = <Link href="/location" className={linkClass}>Set it manually</Link>;
  } else {
    const fullAddress = formatFullLocationAddress(location);
    icon = <MapPin size={iconSize} className="shrink-0 text-taupe" aria-hidden="true" />;
    main = (
      <span title={fullAddress} className="block truncate font-semibold text-ink">
        {fullAddress}
      </span>
    );
    // The Davao City fallback isn't the visitor's spot, so invite them to set it.
    link = <Link href="/location" className={linkClass}>{location.isDefault ? 'Set my location' : 'Change'}</Link>;
  }

  if (bar) {
    return (
      <div aria-live="polite" className="flex min-h-10 items-center gap-2 border-t border-line px-4 py-1.5 text-[13px]">
        {icon}
        <div className="min-w-0 flex-1">{main}</div>
        {link && <span className="shrink-0">{link}</span>}
      </div>
    );
  }

  return (
    <div aria-live="polite" className="flex min-w-0 items-center gap-2.5 leading-tight">
      {icon}
      <div className="min-w-0 text-sm">
        {main}
        {status !== 'locating' && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted whitespace-nowrap">
            {location && status === 'ready' && currentDateTime && (
              // Laptop and up only: on a tablet this line would run under the centred logo.
              <span className="hidden lg:contents">
                <span suppressHydrationWarning>{currentDateTime}</span>
                <span aria-hidden="true">·</span>
              </span>
            )}
            {link}
          </p>
        )}
      </div>
    </div>
  );
}
