import { ChevronRight } from 'lucide-react';
import { recentKey, removeRecentSearches, useRecentSearches, type RecentSearch } from '@/lib/recentSearches';
import GarmentTiles from '../GarmentTiles';
import RecentSearchRow from './RecentSearchRow';

/** How many past searches the panel shows; the rest are on the Recent Searches page. */
const SHOWN = 10;

interface SearchFocusPanelProps {
  /** What is typed so far: the categories hide and the past searches are narrowed to it. */
  readonly query: string;
  /** A category tile (its search word) or a past entry was tapped. */
  readonly onPick: (entry: RecentSearch) => void;
  /** "More from recent history": opens the full Recent Searches page. */
  readonly onMore: () => void;
}

/**
 * Opens the moment the Map's search bar is tapped (phone / tablet): the garment categories, then the last 10 searches
 * (each with an X to delete it) and, past 10, "More from recent history".
 */
export default function SearchFocusPanel({ query, onPick, onMore }: SearchFocusPanelProps) {
  const all = useRecentSearches();
  const q = query.trim().toLowerCase();
  const recent = q ? all.filter((r) => r.term.toLowerCase().includes(q)) : all;

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pb-[calc(var(--bottom-nav-space)+16px)] pt-4 min-[481px]:px-6">
      {!q && <GarmentTiles onSearch={(term) => onPick({ term, kind: 'search', at: Date.now() })} title="Categories" />}

      {recent.length > 0 && (
        <section aria-labelledby="recent-searches-title" className={q ? '' : 'mt-8'}>
          <h3 id="recent-searches-title" className="mobile-h4 text-ink">Recent searches</h3>
          <ul className="mt-1 divide-y divide-line">
            {recent.slice(0, SHOWN).map((r) => (
              <li key={recentKey(r)}>
                <RecentSearchRow entry={r} onPick={onPick} onRemove={(e) => removeRecentSearches([recentKey(e)])} />
              </li>
            ))}
          </ul>
          {recent.length > SHOWN && (
            <button type="button" onClick={onMore} className="mt-1 flex min-h-12 w-full items-center justify-between border-t border-line text-sm font-semibold text-taupe-dark hover:text-ink">
              More from recent history <ChevronRight size={18} aria-hidden />
            </button>
          )}
        </section>
      )}
    </div>
  );
}
