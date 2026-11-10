import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { isApproximate, type SavedLocation } from '@/lib/customerLocation';
import { HOME_COLUMN } from './homeLayout';

interface LocationBarProps {
  readonly location: SavedLocation | null;
  /** Where "Change" (and the address itself) leads: the place picker. */
  readonly changeHref: string;
  /** false until the saved place has been read: the line stays blank (same height) rather than showing a placeholder. */
  readonly ready?: boolean;
}

/**
 * The very top strip of the page: where the shops are measured from, with "Change". ALWAYS one row, at every width
 * down to 320px: the address takes the room and is cut with "…"; the words around it shrink instead of wrapping —
 * "Shops near" / "Near (approximate)" appear only from 400px (a rough fix shows "≈" before the address below that), and
 * the link says "Set exact spot" only from 640px ("Change" below).
 */
export default function LocationBar({ location, changeHref, ready = true }: LocationBarProps) {
  const rough = isApproximate(location);
  return (
    <div className="border-b border-line bg-canvas">
      <div className={`${HOME_COLUMN} flex h-11 items-center gap-2 sm:gap-3`}>
        <MapPin size={16} className="shrink-0 text-taupe-dark" aria-hidden />
        <p className={`mobile-body-sm min-w-0 flex-1 truncate whitespace-nowrap text-ink transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-ink-muted max-[399px]:hidden">{rough ? 'Near (approximate) ' : 'Shops near '}</span>
          {rough && <span className="text-ink-muted min-[400px]:hidden" title="Approximate location">≈ </span>}
          <span className="font-medium">{location?.address || 'Davao City'}</span>
        </p>
        <Link href={changeHref} className="flex h-11 shrink-0 items-center whitespace-nowrap text-sm font-semibold text-taupe-dark underline-offset-4 hover:underline">
          {rough ? <><span className="max-sm:hidden">Set exact spot</span><span className="sm:hidden">Change</span></> : 'Change'}
        </Link>
      </div>
    </div>
  );
}
