import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import type { SavedLocation } from '@/lib/customerLocation';
import LiveClock from './LiveClock';

interface LocationLineProps {
  readonly location: SavedLocation | null;
  /** Tapping the address opens the place picker. */
  readonly changeHref: string;
  /** One line only, for the small floating bar on a phone. */
  readonly compact?: boolean;
  /** Smaller type (the search screen). */
  readonly small?: boolean;
}

/** Where I am, stacked tightly (5px apart): the full address, my district, then the live date and time. On the search screen the district and the time share one row, joined by a middle dot. */
export default function LocationLine({ location, changeHref, compact = false, small = false }: LocationLineProps) {
  // The search screen (small) and the phone's floating card (compact) keep the address on ONE row, arrow included.
  const oneRow = compact || small;

  return (
    <div className={`flex flex-col gap-[3px] ${small ? '' : 'pt-1.5'}`}>
      {/* The extra tap area is drawn outside the text so it adds no spacing. */}
      <Link href={changeHref} title="Change location" className="group relative block before:absolute before:inset-x-0 before:-inset-y-2">
        <span className={`flex gap-2 ${oneRow ? 'items-center' : 'items-start'}`}>
          <MapPin size={small ? 14 : 18} className={`shrink-0 text-taupe ${oneRow ? '' : 'mt-[3px]'}`} />
          <span
            suppressHydrationWarning
            className={`${small ? 'mobile-body-sm font-semibold' : 'mobile-body-md font-medium'} min-w-0 text-ink transition-colors group-hover:text-taupe ${oneRow ? 'truncate' : 'line-clamp-2 flex-1'}`}
          >
            {location?.address || 'Set your location'}
            {/* Right after the text, to show the address can be tapped to change the place. */}
            {!oneRow && <ChevronRight size={16} className="ml-0.5 inline-block align-[-3px] text-ink-faint" />}
          </span>
          {oneRow && <ChevronRight size={16} className="shrink-0 text-ink-faint" />}
        </span>
      </Link>
      {small ? (
        // Search screen: date and time together on the left, one row.
        <div className="flex items-center pl-[22px]">
          <LiveClock className="mobile-caption shrink-0 font-medium text-taupe" />
        </div>
      ) : (
        <LiveClock className="mobile-body-sm pl-[26px] text-taupe" />
      )}
    </div>
  );
}
