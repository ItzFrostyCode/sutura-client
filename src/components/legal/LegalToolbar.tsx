import { Search, X } from 'lucide-react';

/** Search the text, and open or close every section at once. */
export default function LegalToolbar({ query, onQuery, count, onExpand, onCollapse }: { readonly query: string; readonly onQuery: (v: string) => void; readonly count: number; readonly onExpand: () => void; readonly onCollapse: () => void }) {
  const searching = query.trim() !== '';
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="flex min-h-12 flex-1 items-center gap-2.5 rounded-xl border border-line-strong bg-surface px-3.5 focus-within:border-ink">
        <Search size={18} className="shrink-0 text-ink-muted" />
        <span className="sr-only">Search these terms</span>
        <input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search these terms" className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-faint focus:outline-none" />
        {searching && <button type="button" onClick={() => onQuery('')} aria-label="Clear search" className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted"><X size={16} /></button>}
      </label>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p className="text-sm text-ink-muted" role="status">{searching ? `${count} ${count === 1 ? 'match' : 'matches'}` : `${count} sections`}</p>
        {!searching && (
          <div className="flex gap-1 text-sm font-semibold text-taupe-dark">
            <button type="button" onClick={onExpand} className="min-h-11 px-2 hover:text-ink">Expand all</button>
            <button type="button" onClick={onCollapse} className="min-h-11 px-2 hover:text-ink">Collapse</button>
          </div>
        )}
      </div>
    </div>
  );
}
