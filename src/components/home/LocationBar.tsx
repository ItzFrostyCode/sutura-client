import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { SavedLocation } from '@/lib/customerLocation';
import LiveClock from './LiveClock';

interface LocationBarProps {
  readonly location: SavedLocation | null;
  /** Tapping the address opens the place picker. */
  readonly changeHref: string;
}

/** The very top strip of the page: where I am and the live date and time, with a line under it. One row when it fits; a long address goes to the next line (never cut with "…"). */
export default function LocationBar({ location, changeHref }: LocationBarProps) {
  return (
    <div className="border-b border-line bg-canvas">
      <div className="mx-auto flex min-h-9 w-full max-w-[960px] flex-wrap items-center gap-x-3 gap-y-0.5 px-6 py-1.5 sm:px-12 lg:px-0">
        <Link href={changeHref} title="Change location" className="mobile-caption flex min-w-0 items-start gap-1.5 font-medium text-ink transition-colors hover:text-taupe">
          <MapPin size={14} className="mt-px shrink-0 text-taupe" />
          <span suppressHydrationWarning className="min-w-0 break-words">{location?.address || 'Set your location'}</span>
        </Link>
        <span aria-hidden className="hidden h-3.5 w-px shrink-0 bg-line-strong sm:block" />
        <LiveClock className="mobile-caption shrink-0 text-taupe" />
      </div>
    </div>
  );
}
