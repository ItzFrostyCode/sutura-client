import { Check, Clock, X } from 'lucide-react';
import { hoursLine } from '@/lib/storeStatus';
import type { RecentSearch } from '@/lib/recentSearches';

interface RecentSearchRowProps {
  readonly entry: RecentSearch;
  /** Search these words again / open this shop, service or design. */
  readonly onPick: (entry: RecentSearch) => void;
  /** The X: delete this entry for good. Hidden while selecting. */
  readonly onRemove?: (entry: RecentSearch) => void;
  /** Selecting several to delete: the row shows a tick box and tapping it ticks / unticks. */
  readonly selecting?: boolean;
  readonly selected?: boolean;
  readonly onToggle?: (entry: RecentSearch) => void;
}

/** A shop's hours in one line, the Google Maps way: "Open · Closes 6:00 PM" (green / red, amber when soon). */
function ShopHoursLine({ hours }: { readonly hours: RecentSearch['hours'] }) {
  const line = hoursLine(hours);
  if (!line) return <span className="text-ink-muted">Hours not set</span>;
  return (
    <>
      <span className={`font-semibold ${line.open ? 'text-emerald-800' : 'text-rose-700'}`}>{line.open ? 'Open' : 'Closed'}</span>
      <span className="text-ink-muted"> · </span>
      <span className={line.soon ? 'font-semibold text-amber-800' : 'text-ink-muted'}>{line.text}</span>
    </>
  );
}

/** What the row says: the words; or a shop's name, then its place, then Open · Closes …. Long text ends with "…". */
function RowText({ entry }: { readonly entry: RecentSearch }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="mobile-body-md block truncate text-ink">{entry.term}</span>
      {entry.kind === 'shop' && (
        <>
          {entry.address && <span className="mobile-body-sm block truncate text-ink-muted">{entry.address}</span>}
          <span className="mobile-body-sm block truncate"><ShopHoursLine hours={entry.hours} /></span>
        </>
      )}
    </span>
  );
}

/** One past search or opened shop / service / design: clock + text (tap = again), and a plain X on the right to delete it. */
export default function RecentSearchRow({ entry, onPick, onRemove, selecting = false, selected = false, onToggle }: RecentSearchRowProps) {
  if (selecting) {
    return (
      <button type="button" role="checkbox" aria-checked={selected} onClick={() => onToggle?.(entry)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${selected ? 'border-espresso bg-espresso text-white' : 'border-line-strong'}`} aria-hidden>
          {selected && <Check size={16} strokeWidth={3} />}
        </span>
        <RowText entry={entry} />
      </button>
    );
  }
  return (
    <div className="flex min-h-14 items-center">
      <button type="button" onClick={() => onPick(entry)} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left">
        <Clock size={20} className="shrink-0 text-ink-faint" aria-hidden />
        <RowText entry={entry} />
      </button>
      {onRemove && (
        <button type="button" onClick={() => onRemove(entry)} aria-label={`Delete “${entry.term}” from recent searches`} className="-mr-3 flex h-12 w-12 shrink-0 items-center justify-center text-ink-faint transition-colors hover:text-ink">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
