'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
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
// Top right on mobile/tablet, bottom right on desktop.
// controlsPlacement removed — MapControls positions itself with inline style + lg: class

/**
 * Search and map in one screen. The map fills the whole screen and ONE panel holds the search and the shops:
 * a floating card on the left from 1024px, a bottom sheet below that (tablet and phone).
 * Two states: normal collapsed view and full expanded view. Exactly 2 clicks: expand and un-expand.
 */
export default function SearchMapView() {
  const s = useSearchData();
  useHomeLocation(); // asks the browser once if no location is saved yet
  const map = useSearchMap(s.stores);
  const nav = useNavigation(s.userCoords, map.mapRef);
  const areaRef = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [filterOpen, setFilterOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [shopPath, setShopPath] = useState<string | null>(null);
  const sheet = useBottomSheet(areaRef, Boolean(map.selected));

  // "Focus on me": set when a place was just chosen on /location (?focus=me) or my-location is pressed.
  const [focusMe, setFocusMe] = useState(() => s.searchParams.get('focus') === 'me');

  const filters = useMemo<AllFilters>(
    () => ({ radiusKm: s.radiusKm, status: s.openStatus, minPrice: s.minPrice, maxPrice: s.maxPrice, minRating: s.minRating, district: s.district, barangay: s.barangay, area: s.area, sortBy: s.sortBy }),
    [s.radiusKm, s.openStatus, s.minPrice, s.maxPrice, s.minRating, s.district, s.barangay, s.area, s.sortBy],
  );
  const openFilter = () => setFilterOpen(true);
  const sheetPx = panelOpen ? sheet.height : 0;

  const grow = () => {
    setPanelOpen(true);
  };
  const choose = (branch: Parameters<typeof map.selectPin>[0]) => {
    if (branch && map.selected?.storeSlug !== branch.storeSlug) {
      setShopPath(null);
    }
    map.selectPin(branch);
    if (branch) grow();
  };
  const showOnMap = (slug: string, path?: string) => {
    setShopPath(path ?? null);
    const found = map.selectStore(slug);
    if (found) grow();
    return found;
  };

  // Deep link from Home page or URL: auto-open store if ?store= or ?shop= is specified
  const handledStoreParamRef = useRef<string | null>(null);
  useEffect(() => {
    const targetStore = s.searchParams.get('store') || s.searchParams.get('shop');
    if (targetStore && s.stores.length > 0 && handledStoreParamRef.current !== targetStore) {
      handledStoreParamRef.current = targetStore;
      showOnMap(targetStore);
    }
  }, [s.searchParams, s.stores]);

  const getDirections = (branch: { latitude: number; longitude: number; storeSlug: string }, name: string) => {
    void nav.start({ lat: branch.latitude, lng: branch.longitude }, branch.storeSlug, name);
    sheet.setExpanded(false);
  };
  const locate = () => {
    enableCompass();
    setFocusMe(true);
    map.locate(fitPadding, (loc) => {
      if (nav.route) {
        nav.reroute?.({ lat: loc.lat, lng: loc.lng });
      }
    });
  };

  const handleBack = () => {
    setShopPath(null);
    map.selectPin(null);
    sheet.setExpanded(false);
  };

  const fitPadding = desktop
    ? { left: DESKTOP_PANEL_PX, bottom: NAV_PX }
    : { top: 16, bottom: (panelOpen ? sheet.collapsedHeight : 0) + NAV_PX };

  return (
    <div ref={areaRef} className="relative min-h-0 flex-1 overflow-hidden" style={{ '--sheet-h': `${sheetPx}px` } as CSSProperties}>
      <div className={`absolute inset-0 z-0 ${sheet.expanded ? 'pointer-events-none select-none' : ''}`}>
        <DiscoveryMap
          fullScreen
          branches={map.pins}
          userLocation={nav.position ?? s.userCoords}
          userCourse={nav.course}
          onSelectBranch={choose}
          mapRef={map.mapRef}
          fitPadding={fitPadding}
          route={nav.route?.line ?? null}
          routeFit={nav.fitLine}
          followPosition={sheet.expanded ? null : (nav.following ? nav.position : null)}
          focusUser={focusMe && !sheet.expanded}
          onUserPan={() => { nav.stopFollowing(); setFocusMe(false); }}
          disableFitBounds={focusMe || (nav.following && nav.position !== null) || sheet.expanded}
          interactive={!sheet.expanded}
        />
      </div>

      {/* Desktop: floating card on the left with symmetrical 16px margins when expanded */}
      <aside
        className={`card-soft absolute bottom-[var(--bottom-nav-space)] left-4 top-4 z-20 hidden flex-col overflow-hidden transition-[width] duration-300 ease-in-out lg:flex ${
          sheet.expanded
            ? 'w-[calc(100%-32px)]'
            : 'w-[420px]'
        }`}
      >
        <SearchPanelBody
          s={s}
          onOpenFilter={openFilter}
          onShowOnMap={showOnMap}
          selected={map.selected}
          onBack={handleBack}
          shopPath={shopPath}
          inputRef={s.searchInputRef}
          isExpanded={sheet.expanded}
          onToggleExpand={sheet.toggle}
          onSelectBranch={choose}
        />
      </aside>

      {/* Tablet and phone: bottom sheet without drag line, 2-click expand/collapse */}
      {panelOpen && (
        <section
          aria-label="Search and shops"
          className="absolute inset-x-4 bottom-[var(--bottom-nav-space)] z-20 mx-auto flex max-w-[var(--col-w)] flex-col overflow-hidden rounded-[28px] bg-surface shadow-[0_8px_40px_rgba(45,42,38,0.16)] transition-[height] duration-300 ease-in-out lg:hidden"
          style={{ height: sheet.height }}
        >
          {/* X button removed from inside the panel — toggle lives in MapControls */}
          <SearchPanelBody
            s={s}
            onOpenFilter={openFilter}
            onShowOnMap={showOnMap}
            selected={map.selected}
            onBack={handleBack}
            shopPath={shopPath}
            compact
            isExpanded={sheet.expanded}
            onToggleExpand={sheet.toggle}
            onSelectBranch={choose}
          />
        </section>
      )}

      {/* Map top card: directions or active navigation — hidden when sheet is fully expanded */}
      {!sheet.expanded && (
        <MapTopCard nav={nav} selected={map.selected} userCoords={s.userCoords} onGetDirections={getDirections} />
      )}

      {/* Map controls: always visible, float above bottom sheet on mobile */}
      <MapControls
        onLocate={locate}
        onZoomIn={map.zoomIn}
        onZoomOut={map.zoomOut}
        locating={map.locating}
        onTogglePanel={() => {
          if (panelOpen) {
            setPanelOpen(false);
            sheet.setExpanded(false);
          } else {
            setPanelOpen(true);
          }
        }}
        panelOpen={panelOpen}
        sheetHeight={sheetPx}
      />

      <HomeFilterSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} value={filters} showMore onApply={s.applyAllFilters} />
    </div>
  );
}
