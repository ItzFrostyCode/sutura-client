import { ArrowLeft, Search as SearchIcon, SlidersHorizontal, X, Clock } from 'lucide-react';
import type { RecentLocation } from '@/lib/customerLocation';

interface LocationPickerHeaderProps {
  query: string;
  setQuery: (val: string) => void;
  searching: boolean;
  onSearchSubmit: () => void;
  onClose: () => void;
  showFilterDropdown: boolean;
  setShowFilterDropdown: (fn: (prev: boolean) => boolean) => void;
  hasActiveFilters: boolean;
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
  showFilterDropdown,
  setShowFilterDropdown,
  hasActiveFilters,
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint disabled:opacity-50 touch-target-44 w-8 h-8"
          >
            <SearchIcon size={18} className={searching ? 'animate-pulse' : ''} />
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit();
            }}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            placeholder="Search address, store, or link"
            className="w-full h-10 bg-sunken border border-line rounded-full pl-10 pr-9 text-base text-ink placeholder:text-ink-faint placeholder:text-base font-normal focus:outline-none focus:border-taupe"
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

        <button
          type="button"
          onClick={() => setShowFilterDropdown((prev) => !prev)}
          aria-label="Filter stores and districts"
          className={`btn-icon-mobile touch-target-48 relative border transition-colors ${
            hasActiveFilters
              ? 'bg-taupe text-white border-taupe shadow-xs'
              : 'bg-surface text-ink-muted border-line hover:border-taupe'
          }`}
        >
          <SlidersHorizontal size={20} />
          {hasActiveFilters && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-canvas" />
          )}
        </button>
      </header>

      {/* Suggestions Dropdown */}
      {suggestionsVisible && (
        <div className="absolute left-0 right-0 top-[52px] sm:top-[56px] z-20 bg-canvas border-b border-line max-h-72 overflow-y-auto shadow-md">
          {searchResults.length > 0 ? (
            <div>
              <p className="mobile-overline text-ink-faint px-3 pt-2 pb-1">
                {searchResults.length} matches — pick one
              </p>
              {searchResults.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  type="button"
                  onClick={() => onPickSearchResult(r)}
                  className="mobile-nav-row w-full flex items-center gap-3 px-3 py-3 border-t border-line text-left hover:bg-surface transition-colors"
                >
                  <SearchIcon size={18} className="text-ink-faint shrink-0" />
                  <span className="mobile-body-sm text-ink-body font-normal">{r.display_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p className="mobile-overline text-ink-faint px-3 pt-2 pb-1">Recent</p>
              {recents.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  type="button"
                  onClick={() => onPickRecent(r)}
                  className="mobile-nav-row w-full flex items-center gap-3 px-3 py-3 border-t border-line text-left hover:bg-surface transition-colors"
                >
                  <Clock size={18} className="text-ink-faint shrink-0" />
                  <span className="mobile-body-sm text-ink-body truncate font-normal">{r.address}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
