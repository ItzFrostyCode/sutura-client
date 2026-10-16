import { ArrowLeft, Search as SearchIcon, X, Clock, MapPin, Loader2 } from 'lucide-react';
import type { RecentLocation } from '@/lib/customerLocation';

interface LocationPickerHeaderProps {
  query: string;
  setQuery: (val: string) => void;
  searching: boolean;
  onSearchSubmit: () => void;
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
  return (
    <>
      <header className="relative z-20 flex items-center gap-1.5 px-2 h-[52px] sm:h-[56px] border-b border-line shrink-0 bg-canvas">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="btn-icon-mobile text-ink-muted hover:text-ink touch-target-48"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex-1 relative min-w-0">
          <button
            type="button"
            onClick={onSearchSubmit}
            disabled={!query.trim() || searching}
            aria-label="Search"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-ink-faint disabled:opacity-50 w-6 h-6 focus:outline-none"
          >
            <SearchIcon size={18} className={searching ? 'animate-pulse text-taupe' : ''} />
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit();
            }}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            placeholder="Search address or landmark"
            className="w-full h-10 bg-sunken border border-line rounded-full pl-11 pr-9 text-sm sm:text-base text-ink placeholder:text-ink-faint placeholder:text-sm sm:placeholder:text-base font-normal focus:outline-none focus:border-taupe transition-colors"
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

      {/* Suggestions Dropdown */}
      {suggestionsVisible && (
        <div className="absolute left-0 right-0 top-[52px] sm:top-[56px] z-30 bg-canvas border-b border-line max-h-72 overflow-y-auto shadow-lg">
          {searching && searchResults.length === 0 ? (
            <div className="flex items-center gap-2.5 px-4 py-3.5 text-xs text-ink-muted">
              <Loader2 size={16} className="animate-spin text-taupe shrink-0" />
              <span>Searching places in Davao City...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <p className="mobile-overline text-ink-faint px-3 pt-2 pb-1">
                {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'} — pick one
              </p>
              {searchResults.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onPickSearchResult(r);
                  }}
                  className="mobile-nav-row w-full flex items-center gap-3 px-3 py-3 border-t border-line text-left hover:bg-surface transition-colors cursor-pointer"
                >
                  <MapPin size={18} className="text-taupe shrink-0" />
                  <span className="mobile-body-sm text-ink-body font-normal">{r.display_name}</span>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="px-4 py-3 text-xs text-ink-muted">
              No matching places found. Try a street name or landmark (e.g. Pichon St, Almendras Gym).
            </div>
          ) : recents.length > 0 ? (
            <div>
              <p className="mobile-overline text-ink-faint px-3 pt-2 pb-1">Recent Locations</p>
              {recents.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onPickRecent(r);
                  }}
                  className="mobile-nav-row w-full flex items-center gap-3 px-3 py-3 border-t border-line text-left hover:bg-surface transition-colors cursor-pointer"
                >
                  <Clock size={18} className="text-ink-faint shrink-0" />
                  <span className="mobile-body-sm text-ink-body truncate font-normal">{r.address}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
