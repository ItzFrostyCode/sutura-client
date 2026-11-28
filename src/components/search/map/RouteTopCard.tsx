'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bike, Car, Footprints } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { formatMinutesShort } from './travelTime';
import RouteSummary from './RouteSummary';
import type { ShownRoute } from './useNavigation';
import type { TravelMode } from './useRouteTo';
import { getSavedLocation, type SavedLocation, LOCATION_CHANGED_EVENT } from '@/lib/customerLocation';
import SuturaMark from '@/components/brand/SuturaMark';

const SLOT = 'max-lg:inset-x-4 max-lg:top-3 lg:right-4 lg:top-4 lg:w-[440px]';

const TABS: { mode: TravelMode; label: string; Icon: typeof Car }[] = [
  { mode: 'car', label: 'Drive', Icon: Car },
  { mode: 'bike', label: 'Bike', Icon: Bike },
  { mode: 'foot', label: 'Walk', Icon: Footprints },
];

interface RouteTopCardProps {
  readonly route: ShownRoute;
  readonly mode: TravelMode;
  readonly onMode: (mode: TravelMode) => void;
  /** Back out of the route to the shop. */
  readonly onBack: () => void;
}

/**
 * Directions mode at top of map:
 * - Back button
 * - Origin: with stroke, clickable/inputable, showing full location label, select-all on click, Sutura logo mark
 * - Destination: pure clean tailoring shop name with NO stroke
 * - Travel mode tabs (Drive, Bike, Walk)
 */
export default function RouteTopCard({ route, mode, onMode, onBack }: RouteTopCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [savedLoc, setSavedLoc] = useState<SavedLocation | null>(null);
  const [originText, setOriginText] = useState('Your location');

  // Build bulletproof returnTo URL retaining search params, active store, and directions mode
  const targetParams = new URLSearchParams(searchParams?.toString() || '');
  if (route.slug) {
    targetParams.set('store', route.slug);
  }
  targetParams.set('directions', '1');
  const returnToUrl = `${pathname}?${targetParams.toString()}`;
  const locationPickerHref = `/location?returnTo=${encodeURIComponent(returnToUrl)}`;

  // Load saved location label
  useEffect(() => {
    const loc = getSavedLocation();
    setSavedLoc(loc);
    if (loc?.address) {
      setOriginText(loc.address);
    }

    const handleLocChange = (e: Event) => {
      const detail = (e as CustomEvent<SavedLocation>).detail;
      setSavedLoc(detail);
      if (detail?.address) {
        setOriginText(detail.address);
      }
    };

    window.addEventListener(LOCATION_CHANGED_EVENT, handleLocChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, handleLocChange);
  }, []);

  return (
    <div className={`card-soft absolute z-20 p-3 shadow-lg ${SLOT}`}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the shop"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-sunken active:opacity-70 cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        {/* ── Vertical Indicator: Brown circle (origin) -> 3 dots -> Sutura SVG logo (destination) ── */}
        <div className="flex flex-col items-center shrink-0 w-5 pt-3.5 pb-2" aria-hidden>
          {/* Top: Brown circle for user's location */}
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-espresso bg-surface shadow-2xs" />

          {/* 3 vertical connecting dots */}
          <div className="my-1.5 flex flex-col items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-taupe-dark/80" />
            <span className="h-1 w-1 rounded-full bg-taupe-dark/80" />
            <span className="h-1 w-1 rounded-full bg-taupe-dark/80" />
          </div>

          {/* Bottom: Sutura SVG logo for tailoring shop destination (replaces red pin) */}
          <SuturaMark className="h-4.5 w-4.5 shrink-0 text-espresso" />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* 1. Origin: Clickable WITH STROKE / BORDER (No icon inside placeholder) */}
          <Link
            href={locationPickerHref}
            className="group flex min-h-11 items-center justify-between gap-2.5 rounded-xl border border-line-strong bg-surface px-3 py-2 text-ink transition-all hover:border-ink hover:bg-sunken active:scale-[0.99] cursor-pointer"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
              {originText || 'Your location'}
            </span>
            <span className="shrink-0 text-xs sm:text-sm font-semibold text-taupe-dark group-hover:text-ink underline-offset-4 group-hover:underline">
              Change
            </span>
          </Link>

          {/* 2. Destination: Tailoring Shop WITHOUT STROKE / BORDER */}
          <div className="flex min-h-9 items-center px-1 py-1 text-sm font-semibold text-ink">
            <span className="truncate">{route.name}</span>
          </div>
        </div>
      </div>

      {/* Travel mode selector tabs */}
      <div role="tablist" aria-label="Way of travelling" className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-line/60 pt-2.5">
        {TABS.map(({ mode: m, label, Icon }) => {
          const on = m === mode;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${label}, ${formatMinutesShort(route[m].minutes)}`}
              onClick={() => onMode(m)}
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-full px-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                on ? 'bg-espresso/10 font-semibold text-espresso shadow-2xs' : 'text-ink-muted hover:bg-sunken'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span>{formatMinutesShort(route[m].minutes)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 hidden border-t border-line pt-3 lg:block">
        <RouteSummary route={route} mode={mode} />
      </div>
    </div>
  );
}
