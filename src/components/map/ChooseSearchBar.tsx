import { ArrowLeft, Loader2, MapPin, Search, X } from 'lucide-react';

interface ChooseSearchBarProps {
  readonly query: string;
  readonly setQuery: (value: string) => void;
  readonly searching: boolean;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
  readonly onClear: () => void;
}

/** One soft pill floating over the map: Back, the search field, and search / clear. */
export default function ChooseSearchBar({ query, setQuery, searching, onBack, onSubmit, onClear }: ChooseSearchBarProps) {
  return (
    <div className="flex h-14 items-center gap-1 rounded-full border border-line/60 bg-surface pl-2 pr-2 shadow-[0_1px_2px_rgba(45,42,38,0.04),0_8px_24px_rgba(45,42,38,0.12)]">
      <button type="button" onClick={onBack} aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-sunken active:bg-sunken">
        <ArrowLeft size={20} />
      </button>
      <MapPin size={20} className="shrink-0 text-taupe" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
        placeholder="Search a place in Davao"
        aria-label="Search a place"
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-base text-ink placeholder:text-ink-faint focus:outline-none"
      />
      <button
        type="button"
        onClick={query ? onClear : onSubmit}
        aria-label={query ? 'Clear search' : 'Search'}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sunken hover:text-ink"
      >
        {searching ? <Loader2 size={18} className="animate-spin" /> : query ? <X size={18} /> : <Search size={18} />}
      </button>
    </div>
  );
}
