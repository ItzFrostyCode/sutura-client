'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Clock, Home, Loader2, MapPin, X } from 'lucide-react';
import ChooseSearchBar from './ChooseSearchBar';
import ChooseConfirmCard from './ChooseConfirmCard';
import { DAVAO_CENTER, DAVAO_POPULAR_LANDMARKS, useChooseLocation } from './useChooseLocation';

const DiscoveryMap = dynamic(() => import('@/components/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">Loading map…</div>,
});

import type { SavedLocation } from '@/lib/customerLocation';

export interface ChooseLocationScreenProps {
  readonly initial?: SavedLocation | null;
  readonly onClose?: () => void;
  readonly onConfirm?: (loc: SavedLocation) => void;
  readonly confirmLabel?: string;
}

function HighlightMatch({ text, query }: { readonly text: string; readonly query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <span>{text}</span>;
  const words = trimmed
    .split(/[\s,.-]+/)
    .filter((w) => w.length >= 2 && !/^(?:in|of|front|near|beside|across|at|the|ste|st|davao|city)$/i.test(w));

  if (words.length === 0) return <span>{text}</span>;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="font-semibold text-ink">
            {part}
          </span>
        ) : (
          <span key={i} className="text-ink/80">
            {part}
          </span>
        )
      )}
    </span>
  );
}

/** Choose a place on the map: the map and a pin in its middle, a search bar above, and the address with one button below. No shops. */
export default function ChooseLocationScreen(props?: ChooseLocationScreenProps) {
  const c = useChooseLocation(props);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when tapping/clicking outside the search bar & suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        c.setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [c]);

  const isQuerying = c.query.trim().length > 0;
  const showDropdown = c.isFocused || isQuerying;

  const qLower = c.query.trim().toLowerCase();
  const matchingRecents = isQuerying
    ? c.recents.filter((r) => r.address.toLowerCase().includes(qLower) || r.district?.toLowerCase().includes(qLower))
    : [];

  const filteredSuggestions = c.suggestions.filter(
    (s) => !matchingRecents.some((r) => Math.abs(r.lat - s.lat) < 0.0005 && Math.abs(r.lng - s.lng) < 0.0005)
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-canvas">
      {c.start !== undefined && (
        <DiscoveryMap
          fullScreen
          branches={[]}
          userLocation={c.userLocation}
          selectable
          onMoveEnd={c.handleMapMoveEnd}
          mapRef={c.mapRef}
          disableFitBounds
          initialView={c.start ?? { lat: DAVAO_CENTER.lat, lng: DAVAO_CENTER.lng, zoom: 13 }}
        />
      )}

      <div
        ref={searchWrapperRef}
        className="pointer-events-none absolute inset-x-4 top-4 z-[1000] mx-auto flex max-w-[560px] flex-col gap-2"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pointer-events-auto">
          <ChooseSearchBar
            query={c.query}
            setQuery={c.setQuery}
            searching={c.searching}
            onBack={c.goBack}
            onSubmit={() => void c.submitSearch()}
            onClear={c.clearSearch}
            onFocus={() => c.setIsFocused(true)}
          />
        </div>

        {/* Recents and Suggestions Dropdown */}
        {showDropdown && (
          <div className="card-soft pointer-events-auto max-h-[62dvh] overflow-y-auto rounded-3xl border border-line/60 bg-surface/98 p-2 shadow-[0_8px_30px_rgba(45,42,38,0.14)] backdrop-blur-md">
            {!isQuerying ? (
              // BEFORE TYPING: Home + Recents (or Popular Landmarks)
              <div className="space-y-1">
                {c.homeLocation && (
                  <button
                    type="button"
                    onClick={() => c.pickPlace(c.homeLocation!.lat, c.homeLocation!.lng, c.homeLocation!.address)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors hover:bg-sunken active:bg-sunken"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-taupe/10 text-taupe-dark">
                      <Home size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{c.homeLocation.label || 'Home'}</span>
                      <span className="block truncate text-xs text-ink-muted">{c.homeLocation.address}</span>
                    </span>
                  </button>
                )}

                {c.recents.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        Recent searches
                      </span>
                      <button
                        type="button"
                        onClick={c.clearAllRecents}
                        className="text-xs font-medium text-ink-muted transition-colors hover:text-ink"
                      >
                        Clear all
                      </button>
                    </div>
                    {c.recents.map((recent, i) => (
                      <div
                        key={`${recent.lat}-${recent.lng}-${i}`}
                        className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-sunken active:bg-sunken"
                      >
                        <button
                          type="button"
                          onClick={() => c.pickPlace(recent.lat, recent.lng, recent.address)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted group-hover:bg-surface group-hover:text-taupe">
                            <Clock size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{recent.address.split(',')[0]}</span>
                            <span className="block truncate text-xs text-ink-muted">{recent.address}</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            c.removeRecent(recent.lat, recent.lng);
                          }}
                          aria-label="Remove recent"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint opacity-60 transition-opacity hover:bg-surface hover:text-ink hover:opacity-100"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Popular places in Davao
                    </div>
                    {DAVAO_POPULAR_LANDMARKS.map((landmark, i) => (
                      <button
                        key={`${landmark.lat}-${landmark.lng}-${i}`}
                        type="button"
                        onClick={() => c.pickPlace(landmark.lat, landmark.lng, landmark.address)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-sunken active:bg-sunken"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-taupe">
                          <MapPin size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{landmark.name}</span>
                          <span className="block truncate text-xs text-ink-muted">{landmark.address}</span>
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : (
              // WHILE TYPING: Matching Recents + Live Suggestions
              <div className="space-y-1">
                {c.searching && matchingRecents.length === 0 && filteredSuggestions.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink-muted">
                    <Loader2 size={18} className="animate-spin text-taupe" />
                    Searching places in Davao…
                  </div>
                )}

                {matchingRecents.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Recent
                    </div>
                    {matchingRecents.map((recent, i) => (
                      <div
                        key={`match-recent-${recent.lat}-${recent.lng}-${i}`}
                        className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-sunken active:bg-sunken"
                      >
                        <button
                          type="button"
                          onClick={() => c.pickPlace(recent.lat, recent.lng, recent.address)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted group-hover:bg-surface group-hover:text-taupe">
                            <Clock size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ink">
                              <HighlightMatch text={recent.address.split(',')[0]} query={c.query} />
                            </span>
                            <span className="block truncate text-xs text-ink-muted">
                              <HighlightMatch text={recent.address} query={c.query} />
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            c.removeRecent(recent.lat, recent.lng);
                          }}
                          aria-label="Remove recent"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint opacity-60 transition-opacity hover:bg-surface hover:text-ink hover:opacity-100"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {filteredSuggestions.length > 0 && (
                  <>
                    {matchingRecents.length > 0 && (
                      <div className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Suggestions
                      </div>
                    )}
                    {filteredSuggestions.map((place, i) => (
                      <button
                        key={`sug-${place.lat}-${place.lng}-${i}`}
                        type="button"
                        onClick={() => c.pickPlace(place.lat, place.lng, place.display_name)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors hover:bg-sunken active:bg-sunken"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-taupe">
                          <MapPin size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink">
                            <HighlightMatch text={place.display_name.split(',')[0]} query={c.query} />
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            <HighlightMatch text={place.display_name} query={c.query} />
                          </span>
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {!c.searching && matchingRecents.length === 0 && filteredSuggestions.length === 0 && (
                  <div className="py-6 px-4 text-center text-sm text-ink-muted">
                    No places found for &quot;<span className="font-semibold text-ink">{c.query}</span>&quot;.
                    <p className="mt-1 text-xs text-ink-muted/80">Try searching for a street, landmark, or barangay in Davao City.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {c.error && <p className="mobile-body-sm pointer-events-auto rounded-2xl bg-surface px-4 py-3 text-danger shadow-[0_2px_12px_rgba(45,42,38,0.12)]">{c.error}</p>}
      </div>

      <div className="absolute inset-x-4 bottom-4 z-1000 mx-auto max-w-140">
        <ChooseConfirmCard
          address={c.address}
          reverseLoading={c.reverseLoading}
          locating={c.locating}
          onLocate={c.locate}
          onZoomIn={c.zoomIn}
          onZoomOut={c.zoomOut}
          onConfirm={c.confirm}
          confirmLabel={props?.confirmLabel}
        />
      </div>
    </div>
  );
}
