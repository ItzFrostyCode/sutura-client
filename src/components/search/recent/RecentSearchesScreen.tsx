'use client';

import { useState } from 'react';
import { ChevronLeft, ListChecks, Clock } from 'lucide-react';
import { groupRecentSearches, recentKey, removeRecentSearches, useRecentSearches, type RecentSearch } from '@/lib/recentSearches';
import RecentSearchRow from './RecentSearchRow';

interface RecentSearchesScreenProps {
  readonly onBack: () => void;
  readonly onPick: (entry: RecentSearch) => void;
}

/**
 * Every past search, full screen: ‹ Back · "Recent Searches" · select icon, then Today / This week / Last week / Previous
 * searches. Each row has an X; the select icon ticks several (or Select all) and a bottom bar offers Cancel / Delete.
 */
export default function RecentSearchesScreen({ onBack, onPick }: RecentSearchesScreenProps) {
  const all = useRecentSearches();
  const groups = groupRecentSearches(all);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const allPicked = all.length > 0 && picked.size === all.length;

  const toggle = (entry: RecentSearch) => setPicked((prev) => {
    const next = new Set(prev);
    const key = recentKey(entry);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const stopSelecting = () => { setSelecting(false); setPicked(new Set()); };
  const deletePicked = () => { removeRecentSearches([...picked]); stopSelecting(); };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="recent-title" className="fixed inset-0 z-[60] flex flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col overflow-hidden border-line min-[600px]:border-x">
        {/* Header: back · title (centre) · select icon (or Select all while selecting) */}
        <header className="grid h-14 shrink-0 grid-cols-[96px_1fr_96px] items-center border-b border-line px-2">
          <button type="button" onClick={selecting ? stopSelecting : onBack} aria-label="Back" className="flex h-12 w-12 items-center justify-center rounded-full text-ink hover:bg-sunken">
            <ChevronLeft size={26} />
          </button>
          <h2 id="recent-title" className="mobile-h4 truncate text-center text-ink">
            {selecting ? (picked.size ? `${picked.size} selected` : 'Select searches') : 'Recent Searches'}
          </h2>
          <div className="flex justify-end">
            {selecting ? (
              <button type="button" onClick={() => setPicked(allPicked ? new Set() : new Set(all.map(recentKey)))} className="min-h-12 px-2 text-sm font-semibold text-taupe-dark hover:text-ink">
                {allPicked ? 'Deselect all' : 'Select all'}
              </button>
            ) : all.length > 0 && (
              <button type="button" onClick={() => setSelecting(true)} aria-label="Select searches to delete" className="flex h-12 w-12 items-center justify-center rounded-full text-ink hover:bg-sunken">
                <ListChecks size={22} />
              </button>
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 min-[481px]:px-6">
          {groups.length === 0 && (
            <div className="py-16 text-center">
              <Clock size={28} className="mx-auto mb-2 text-ink-faint" aria-hidden />
              <p className="mobile-h4 text-ink">No recent searches</p>
              <p className="mobile-body-sm mt-1 text-ink-muted">What you search on the map shows up here.</p>
            </div>
          )}
          {groups.map((g) => (
            <section key={g.label} className="mt-6 first:mt-4">
              <h3 className="mobile-overline text-ink-muted">{g.label}</h3>
              <ul className="mt-1 divide-y divide-line">
                {g.items.map((r) => (
                  <li key={recentKey(r)}>
                    <RecentSearchRow
                      entry={r}
                      onPick={onPick}
                      onRemove={(e) => removeRecentSearches([recentKey(e)])}
                      selecting={selecting}
                      selected={picked.has(recentKey(r))}
                      onToggle={toggle}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Selecting: Cancel / Delete pinned to the bottom. */}
        {selecting && (
          <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-line bg-surface px-4 pt-3 min-[481px]:px-6" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
            <button type="button" onClick={stopSelecting} className="btn-secondary-mobile h-[52px] rounded-full border border-line-strong text-base font-medium text-ink">
              Cancel
            </button>
            <button type="button" onClick={deletePicked} disabled={picked.size === 0} className="btn-primary-mobile h-[52px] rounded-full bg-danger text-base font-semibold text-white disabled:opacity-40">
              Delete{picked.size ? ` (${picked.size})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
