import { ArrowLeft, Search as SearchIcon, X, Clock, MapPin } from 'lucide-react';
import type { RecentLocation } from '@/lib/customerLocation';

/** Well-known Davao places to jump to — searched by name, so no coordinates are hard-coded. */
const POPULAR_PLACES = [
  'SM Lanang Premier',
  'Abreeza Mall',
  'SM City Davao',
  'Gaisano Mall of Davao',
  "People's Park Davao",
  'Davao City Hall',
];

interface LocationPickerHeaderProps {
  query: string;
  setQuery: (val: string) => void;
  searching: boolean;
  /** No argument: search the box. With text: search that place right away. */
  onSearchSubmit: (text?: string) => void;
  onClose: () => void;
  suggestionsVisible: boolean;
  searchResults: { lat: number; lng: number; display_name: string }[];
  recents: RecentLocation[];
  onPickSearchResult: (r: { lat: number; lng: number; display_name: string }) => void;
  onPickRecent: (loc: RecentLocation) => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
}

export default function LocationPickerHeader({
  query,
  setQuery,
  searching,
  onSearchSubmit,
  onClose,
  suggestionsVisible,
  searchResults,
  recents,
  onPickSearchResult,
  onPickRecent,
  onInputFocus,
  onInputBlur,
}: Readonly<LocationPickerHeaderProps>) {
  const row = 'mobile-nav-row w-full flex items-center gap-3 px-3 py-3 border-t border-line text-left hover:bg-surface transition-colors';

  return (
    // Floats over the full-screen map.
    <div className="absolute inset-x-0 top-0 z-[600] px-3 pt-3 pointer-events-none">
      <div className="mx-auto max-w-xl pointer-events-auto">
        <header className="flex items-center gap-1.5 rounded-2xl border border-line bg-canvas/95 px-1.5 h-14 shadow-lg backdrop-blur-sm">
          <button type="button" onClick={onClose} aria-label="Back" className="btn-icon-mobile text-ink-muted hover:text-ink touch-target-48">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 relative min-w-0">
            <button
              type="button"
              onClick={() => onSearchSubmit()}
              disabled={!query.trim() || searching}
              aria-label="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint disabled:opacity-50 touch-target-44 w-8 h-8"
            >
              <SearchIcon size={18} className={searching ? 'animate-pulse' : ''} />
            </button>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                // Enter searches; it must never submit a form the picker sits in
                // (shop registration's step form showed "Please fill out this field").
                e.preventDefault();
                e.stopPropagation();
                if (query.trim() && !searching) onSearchSubmit();
              }}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              placeholder="Search an address, place or Maps link"
              className="w-full h-10 bg-sunken border border-line rounded-full pl-10 pr-9 text-base text-ink placeholder:text-ink-faint font-normal focus:outline-none focus:border-taupe"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-ink-faint btn-icon-mobile w-8 h-8 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </header>

        {suggestionsVisible && (
          <div className="mt-2 rounded-2xl border border-line bg-canvas max-h-[60dvh] overflow-y-auto shadow-lg">
            {searchResults.length > 0 ? (
              <div>
                <p className="mobile-overline text-ink-faint px-3 pt-2 pb-1">{searchResults.length} matches — pick one</p>
                {searchResults.map((r, i) => (
                  <button key={`${r.lat}-${r.lng}-${i}`} type="button" onClick={() => onPickSearchResult(r)} className={row}>
                    <SearchIcon size={18} className="text-ink-faint shrink-0" />
                    <span className="mobile-body-sm text-ink-body font-normal">{r.display_name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                {recents.length > 0 && (
                  <>
                    <p className="mobile-overline text-ink-faint px-3 pt-2 pb-1">Recent</p>
                    {recents.map((r, i) => (
                      <button key={`${r.lat}-${r.lng}-${i}`} type="button" onClick={() => onPickRecent(r)} className={row}>
                        <Clock size={18} className="text-ink-faint shrink-0" />
                        <span className="mobile-body-sm text-ink-body truncate font-normal">{r.address}</span>
                      </button>
                    ))}
                  </>
                )}
                <p className="mobile-overline text-ink-faint px-3 pt-2 pb-1">Popular in Davao</p>
                {POPULAR_PLACES.map((name) => (
                  // onMouseDown keeps the input's blur from closing the list before the click lands.
                  <button key={name} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onSearchSubmit(name)} className={row}>
                    <MapPin size={18} className="text-ink-faint shrink-0" />
                    <span className="mobile-body-sm text-ink-body truncate font-normal">{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
