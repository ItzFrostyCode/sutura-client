'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { Maximize2, Minimize2 } from 'lucide-react';
import HomeFilterSheet from '@/components/home/HomeFilterSheet';
import { useHomeLocation } from '@/components/home/useHomeLocation';
import type { AllFilters } from '@/components/home/homeFilters';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { enableCompass } from '@/hooks/useCompassHeading';
import { useSearchData } from '../hooks/useSearchData';
import { useSearchMap } from './useSearchMap';
import { useBottomSheet } from './useBottomSheet';
import MapControls from './MapControls';
import MapTopCard from './MapTopCard';
import SearchPanelBody from './SearchPanelBody';
import { useNavigation } from './useNavigation';

const DiscoveryMap = dynamic(() => import('@/components/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">Loading map…</div>,
});

/** Side card on desktop: 16px gap + 420px + 24px of air before the first pin. */
const DESKTOP_PANEL_PX = 460;
const NAV_PX = 76;
// Above the floating bottom navigation (and, below 1024px, above the sheet).
const above = 'max-lg:bottom-[calc(var(--sheet-h)+var(--bottom-nav-space)+12px)] lg:bottom-[calc(var(--bottom-nav-space)+8px)]';
// Tablet and phone share one column with the sheet and the navigation.
const column = 'max-lg:right-[max(16px,calc(50%-var(--col-w)/2))]';
// The four map buttons stacked (4 x 48px + 3 gaps) plus 12px above the sheet and 8px below the top of the screen: with less map showing
// than this, a tall sheet would push the top buttons off screen, so they sit in a row instead.
const COLUMN_NEEDS_PX = 236;
// The card floating at the top of the map (Get Directions / Active navigation, up to 124px) plus 12px above and 8px below it.
const TOP_CARD_PX = 144;

/**
 * Search and map in one screen. The map fills the whole screen and ONE panel holds the search and the shops:
 * a floating card on the left from 1024px, a draggable bottom sheet below that (tablet and phone, automatically).
 * Shops come first; what matches the search drops down under each shop. Tapping a shop (in the list or its pin) opens it
 * inside the same panel, bigger, with one Back to the list. On tablet and phone the brown button under the map buttons is
 * an X that hides the panel and turns into a hamburger that brings it back.
 */
export default function SearchMapView() {
  const s = useSearchData();
  useHomeLocation(); // asks the browser once if no location is saved yet
  const map = useSearchMap(s.stores);
  const nav = useNavigation(s.userCoords, map.mapRef);
  const areaRef = useRef<HTMLDivElement>(null);
  // A card floats at the top of the map while a shop is open or a route is drawn; the sheet and the map buttons leave room for it.
  const topCard = Boolean(map.selected || nav.route);
  const sheet = useBottomSheet(areaRef, topCard ? TOP_CARD_PX : 0);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [filterOpen, setFilterOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  // "Focus on me": set when a place was just chosen on /location (?focus=me) or my-location is pressed. The map then stays zoomed in on
  // the person instead of fitting every pin, until they drag it.
  const [focusMe, setFocusMe] = useState(() => s.searchParams.get('focus') === 'me');

  const filters = useMemo<AllFilters>(
    () => ({ radiusKm: s.radiusKm, status: s.openStatus, minPrice: s.minPrice, maxPrice: s.maxPrice, minRating: s.minRating, district: s.district, sortBy: s.sortBy }),
    [s.radiusKm, s.openStatus, s.minPrice, s.maxPrice, s.minRating, s.district, s.sortBy],
  );
  const openFilter = () => setFilterOpen(true);
  const sheetPx = panelOpen ? sheet.height : 0;
  const sheetCoversMap = panelOpen && !desktop && sheet.snap === 'full';
  // Opening a shop makes the sheet bigger (half at least), and brings the panel back if it was hidden.
  const grow = () => {
    if (desktop) return;
    setPanelOpen(true);
    if (sheet.snap === 'peek') sheet.setSnap('half');
  };
  const choose = (branch: Parameters<typeof map.selectPin>[0]) => {
    setShopPath(null);
    map.selectPin(branch);
    if (branch) grow();
  };
  // Which page of the open shop the panel shows (null = its storefront), e.g. a service tapped in the list.
  const [shopPath, setShopPath] = useState<string | null>(null);
  const showOnMap = (slug: string, path?: string) => {
    setShopPath(path ?? null);
    const found = map.selectStore(slug);
    if (found) grow();
    return found;
  };
  // Get Directions: draw the road route and, on tablet / phone, lower the sheet so the route can be seen.
  const getDirections = (branch: { latitude: number; longitude: number; storeSlug: string }, name: string) => {
    enableCompass(); // on iPhone the compass can only be asked for from a tap
    void nav.start({ lat: branch.latitude, lng: branch.longitude }, branch.storeSlug, name);
    if (!desktop) sheet.setSnap('peek');
  };
  const locate = () => {
    enableCompass();
    setFocusMe(true);
    if (nav.position) nav.recenter(fitPadding);
    else map.locate(fitPadding);
  };
  const expanded = sheet.snap === 'full';
  const fitPadding = desktop
    ? { left: DESKTOP_PANEL_PX, bottom: NAV_PX }
    : { top: 16, bottom: (panelOpen ? sheet.settledHeight : 0) + NAV_PX };

  return (
    <div ref={areaRef} className="relative min-h-0 flex-1 overflow-hidden" style={{ '--sheet-h': `${sheetPx}px` } as CSSProperties}>
      <div className="absolute inset-0 z-0">
        <DiscoveryMap fullScreen branches={map.pins} userLocation={nav.position ?? s.userCoords} userCourse={nav.course} onSelectBranch={choose} mapRef={map.mapRef} fitPadding={fitPadding} route={nav.route?.line ?? null} routeFit={nav.fitLine} followPosition={nav.following ? nav.position : null} focusUser={focusMe} onUserPan={() => { nav.stopFollowing(); setFocusMe(false); }} disableFitBounds={focusMe || (nav.following && nav.position !== null)} />
      </div>

      {/* Desktop: one floating card on the left */}
      <aside className="card-soft absolute bottom-[var(--bottom-nav-space)] left-4 top-4 z-20 hidden w-[420px] flex-col overflow-hidden lg:flex">
        <SearchPanelBody
          s={s}
          onOpenFilter={openFilter}
          onShowOnMap={showOnMap}
          selected={map.selected}
          onBack={() => { setShopPath(null); map.selectPin(null); }}
          shopPath={shopPath}
          inputRef={s.searchInputRef}
        />
      </aside>

      {/* Tablet and phone: the same single panel as a sheet above the navigation — handle, search, shops */}
      {panelOpen && (
        <section
          aria-label="Search and shops"
          className={`absolute inset-x-4 bottom-[var(--bottom-nav-space)] z-20 mx-auto flex max-w-[var(--col-w)] flex-col rounded-[28px] bg-surface shadow-[0_8px_40px_rgba(45,42,38,0.16)] lg:hidden ${sheet.dragging ? '' : 'transition-[height] duration-200'}`}
          style={{ height: sheet.height }}
        >
          <div className="relative shrink-0">
            <button type="button" aria-label="Resize panel" {...sheet.handleProps} className="flex h-11 w-full touch-none items-center justify-center">
              <span className="h-1 w-10 rounded-full bg-line-strong" />
            </button>
            {/* Icon only, top right: grow to full height, or fold back to half. */}
            <button
              type="button"
              onClick={() => sheet.setSnap(expanded ? 'half' : 'full')}
              aria-label={expanded ? 'Make smaller' : 'Expand'}
              className="absolute right-2 top-0 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken active:opacity-70"
            >
              {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
          <SearchPanelBody
            s={s}
            onOpenFilter={openFilter}
            onShowOnMap={showOnMap}
            selected={map.selected}
            onBack={() => { setShopPath(null); map.selectPin(null); }}
          shopPath={shopPath}
            compact
          />
        </section>
      )}

      {!sheetCoversMap && <MapTopCard nav={nav} selected={map.selected} userCoords={s.userCoords} onGetDirections={getDirections} />}
      {!sheetCoversMap && (
        <MapControls
          onLocate={locate}
          onZoomIn={map.zoomIn}
          onZoomOut={map.zoomOut}
          locating={map.locating}
          onTogglePanel={() => setPanelOpen((open) => !open)}
          panelOpen={panelOpen}
          row={!desktop && sheet.total - sheetPx - (topCard ? TOP_CARD_PX : 0) < COLUMN_NEEDS_PX}
          className={`${column} ${above}`}
        />
      )}

      <HomeFilterSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} value={filters} showMore onApply={s.applyAllFilters} />
    </div>
  );
}
