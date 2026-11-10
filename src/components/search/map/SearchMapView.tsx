'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import HomeFilterSheet from '@/components/home/HomeFilterSheet';
import { useHomeLocation } from '@/components/home/useHomeLocation';
import type { AllFilters } from '@/components/home/homeFilters';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { enableCompass } from '@/hooks/useCompassHeading';
import { useSearchData } from '../hooks/useSearchData';
import { useSearchMap } from './useSearchMap';
import { useBottomSheet } from './useBottomSheet';
import MapControls from './MapControls';
import RouteTopCard from './RouteTopCard';
import RouteSummary from './RouteSummary';
import SearchPanelBody from './SearchPanelBody';
import SearchPanelTop from './SearchPanelTop';
import SearchResults from './SearchResults';
import MapListToggle, { type MapListView } from './MapListToggle';
import { rememberSearch } from '@/lib/lastSearch';
import { addRecentItem, addRecentSearch, type RecentSearch } from '@/lib/recentSearches';
import SearchFocusPanel from '../recent/SearchFocusPanel';
import RecentSearchesScreen from '../recent/RecentSearchesScreen';
import { useNavigation } from './useNavigation';

const DiscoveryMap = dynamic(() => import('@/components/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">Loading map…</div>,
});

/** Side card on desktop: 16px gap + 420px + 24px of air before the first pin. */
const DESKTOP_PANEL_PX = 460;
const NAV_PX = 76;
/** Height of the summary bar under the map in Directions mode (phone and tablet). */
const SUMMARY_PX = 140;
/** Room the Directions card needs at the top of the map. */
const ROUTE_TOP_PX = 150;
// Top right on mobile/tablet, bottom right on desktop.
// controlsPlacement removed — MapControls positions itself with inline style + lg: class

/**
 * Search and map in one screen.
 * - Desktop (1024px+): the map fills the screen; a floating card on the left holds the search and the shops.
 * - Phone and tablet: the search, Filter and district chips sit on top; under them EITHER the full map (default) OR the
 *   full list, switched with one tap (MapListToggle — Yelp / Google Maps). On the map, tapping a pin slides that shop's
 *   card up from the bottom; picking a shop in the list jumps to the map with its card open.
 */
export default function SearchMapView() {
  const s = useSearchData();
  useHomeLocation(); // asks the browser once if no location is saved yet
  // What covers the map when a shop is chosen (desktop: the side card; phone / tablet: the shop card at half height),
  // read by the map when it centres on that shop.
  const coverRef = useRef<{ top?: number; left?: number; bottom?: number } | undefined>(undefined);
  const map = useSearchMap(s.stores, coverRef);
  const nav = useNavigation(s.userCoords, map.mapRef);
  const areaRef = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [filterOpen, setFilterOpen] = useState(false);
  const [shopPath, setShopPath] = useState<string | null>(null);
  const sheet = useBottomSheet(areaRef, Boolean(map.selected));
  // Phone / tablet: the map (default) or the list, never both squeezed together.
  const [view, setView] = useState<MapListView>(() => (s.searchParams.get('view') === 'list' ? 'list' : 'map'));
  // Phone / tablet: a chosen shop opens FULL SCREEN in the content area (no slide-up card, no drag handle); its Back
  // returns to the list or the map, whichever the person came from.
  const mobileDetail = !desktop && Boolean(map.selected) && !nav.route;
  const mobileSheet = false;

  // "Focus on me": set when a place was just chosen on /location (?focus=me) or my-location is pressed.
  const [focusMe, setFocusMe] = useState(() => s.searchParams.get('focus') === 'me');

  // "All Davao" picked after a district: frame the whole city (the outline is always drawn). On first opening the map
  // still fits the shops near the person instead, so it does not start zoomed out over all of Davao.
  const [cityView, setCityView] = useState(false);
  const prevDistrict = useRef(s.district);
  useEffect(() => {
    if (prevDistrict.current && !s.district) setCityView(true);
    else if (s.district) setCityView(false);
    prevDistrict.current = s.district;
  }, [s.district]);

  const filters = useMemo<AllFilters>(
    () => ({ radiusKm: s.radiusKm, status: s.openStatus, minPrice: s.minPrice, maxPrice: s.maxPrice, minRating: s.minRating, district: s.district, barangay: s.barangay, area: s.area, sortBy: s.sortBy }),
    [s.radiusKm, s.openStatus, s.minPrice, s.maxPrice, s.minRating, s.district, s.barangay, s.area, s.sortBy],
  );
  const openFilter = () => setFilterOpen(true);
  const sheetPx = nav.route ? SUMMARY_PX : mobileSheet ? sheet.height : 0;
  // On a phone or tablet the map is blocked only while the shop card is pulled up to full height.
  const mapBlocked = sheet.expanded && mobileSheet;

  // A shop chosen on the map, or from the list, opens at the half height.
  const grow = () => { if (sheet.snap === 'peek') sheet.setSnap('half'); };
  const choose = (branch: Parameters<typeof map.selectPin>[0]) => {
    if (branch && map.selected?.storeSlug !== branch.storeSlug) {
      setShopPath(null);
    }
    map.selectPin(branch);
    if (branch) { grow(); rememberShop(branch.storeSlug); }
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
    // Directions mode: the sheet gives way to the route card and the summary.
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

  // Back out of Directions: the route goes and the shop's sheet is back where it was.
  const leaveRoute = () => { nav.cancel(); sheet.setSnap('half'); };

  const handleBack = () => {
    setShopPath(null);
    map.selectPin(null);
    sheet.setExpanded(false);
  };

  // Phone / tablet: tapping the search bar opens the categories + recent searches panel over the map / list; the full
  // history (Today / This week / …) is a screen of its own.
  const [searching, setSearching] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  /** Search (typed words, a category or a past search): remember it, close the panel and show the list. */
  const runSearch = (term?: string) => {
    if (term !== undefined) s.setQ(term);
    const words = (term ?? s.q).trim();
    if (words) addRecentSearch(words);
    setSearching(false);
    setRecentOpen(false);
    handleBack();
    setView('list');
    (document.activeElement as HTMLElement | null)?.blur();
  };
  const stopSearching = () => { setSearching(false); (document.activeElement as HTMLElement | null)?.blur(); };

  /** A shop that was tapped (in the list or on the map) goes into the recent searches with its place and hours. */
  const rememberShop = (slug: string) => {
    const st = s.stores.find((x) => x.slug === slug);
    if (!st) return;
    const b = st.branches?.[0];
    addRecentItem({ kind: 'shop', term: st.name, slug, address: b?.address || b?.city || 'Davao City', hours: st.operating_hours ?? null });
  };

  // A past shop picked in Recent searches: opened on the map. If it is not among the shops shown, the search is cleared
  // and it is opened once the full list has loaded (or, if it is still not there, its own page).
  const router = useRouter();
  const [pendingShop, setPendingShop] = useState<string | null>(null);
  const sawLoading = useRef(false);
  useEffect(() => {
    if (!pendingShop) return;
    if (s.storesLoading) { sawLoading.current = true; return; }
    if (!sawLoading.current) return;
    const slug = pendingShop;
    setPendingShop(null);
    if (!showOnMap(slug)) router.push(`/store/${slug}`);
  }, [pendingShop, s.storesLoading, s.stores]);

  /** A category or a past entry was tapped in the search panel / Recent Searches page. */
  const pickRecent = (entry: RecentSearch) => {
    if (!entry.kind || entry.kind === 'search') { runSearch(entry.term); return; }
    addRecentItem(entry); // back to the top
    setSearching(false);
    setRecentOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
    if (entry.kind === 'shop' && entry.slug) {
      setView('map');
      if (showOnMap(entry.slug)) return;
      sawLoading.current = false;
      s.setQ('');
      setPendingShop(entry.slug);
    } else if (entry.href) {
      router.push(entry.href);
    }
  };

  const fitPadding = desktop
    ? { left: DESKTOP_PANEL_PX, bottom: NAV_PX }
    : { top: nav.route ? ROUTE_TOP_PX : 16, bottom: (nav.route ? SUMMARY_PX : mobileSheet ? sheet.collapsedHeight : 0) + NAV_PX };

  coverRef.current = desktop
    ? { left: DESKTOP_PANEL_PX, bottom: NAV_PX }
    : { top: 16, bottom: Math.round((areaRef.current?.clientHeight ?? 600) * 0.5) + NAV_PX };

  // Where the person is — the List / Map view and the open shop — is kept in the address (next to the search words and
  // filters already there) and remembered for the session, so tapping Discover / Track / Profile by mistake and then
  // Map again brings them back to exactly this (lib/lastSearch, used by the Map tab).
  const openSlug = map.selected?.storeSlug ?? null;
  useEffect(() => {
    const url = new URL(window.location.href);
    if (view === 'list') url.searchParams.set('view', 'list'); else url.searchParams.delete('view');
    const pending = url.searchParams.get('store') ?? url.searchParams.get('shop');
    if (openSlug) { url.searchParams.set('store', openSlug); handledStoreParamRef.current = openSlug; }
    // A shop in the address that has not been opened yet (the list is still loading) is kept, not wiped.
    else if (!pending || handledStoreParamRef.current === pending) { url.searchParams.delete('store'); url.searchParams.delete('shop'); }
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', next);
    rememberSearch(next);
  }, [view, openSlug, s.searchParams]);

  // A shop picked in the list: back to the map, with its card open there.
  const pickFromList = (slug: string, path?: string) => {
    // A shop tapped in the list is remembered (a service / design inside it is remembered by its own card).
    if (!path || path.startsWith('?')) rememberShop(slug);
    return showOnMap(slug, path);
  };

  return (
    <>
    {/* Phone / tablet: search, Filter, List / Map, districts (+ the Shops / Services / Designs tabs on the list). Solid, no glass. */}
    {/* Hidden while a shop is open: the shop has its own search (its Services tab), so there is only ever one. */}
    {!nav.route && !mobileDetail && (
      <div className="shrink-0 border-b border-line bg-surface px-4 pb-2 pt-2 lg:hidden">
        <SearchPanelTop
          s={s}
          onOpenFilter={openFilter}
          compact
          showTabs={view === 'list' && !mobileDetail && !searching}
          onSearch={() => runSearch()}
          onFocus={() => { if (!desktop) setSearching(true); }}
          trailing={searching ? (
            <button type="button" onClick={stopSearching} className="flex min-h-12 shrink-0 items-center px-1 text-base font-medium text-taupe-dark hover:text-ink">Cancel</button>
          ) : (
            <MapListToggle view={view} onChange={(v) => { handleBack(); setView(v); }} />
          )}
        />
      </div>
    )}
    <div ref={areaRef} className="relative min-h-0 flex-1 overflow-hidden" style={{ '--sheet-h': `${sheetPx}px` } as CSSProperties}>
      <div className={`absolute inset-0 z-0 ${mapBlocked ? 'pointer-events-none select-none' : ''}`}>
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
          followPosition={mapBlocked ? null : (nav.following ? nav.position : null)}
          focusUser={focusMe && !mapBlocked}
          onUserPan={() => { nav.stopFollowing(); setFocusMe(false); }}
          disableFitBounds={focusMe || (nav.following && nav.position !== null) || mapBlocked}
          interactive={!mapBlocked}
          highlightDistrict={s.district || null}
          showCity
          fitCity={cityView && !map.selected}
        />
      </div>

      {/* Desktop: a fixed 420px card on the left. No expand: a size carried over from the phone sheet once stretched it
          across the whole map after the window was widened. */}
      {/* Only on desktop: rendered hidden on a phone it also loaded the open shop's page a second time. */}
      {desktop && (
      <aside className="card-soft absolute bottom-[var(--bottom-nav-space)] left-4 top-4 z-20 hidden w-[420px] flex-col overflow-hidden lg:flex">
        <SearchPanelBody
          s={s}
          onOpenFilter={openFilter}
          onShowOnMap={showOnMap}
          selected={map.selected}
          onBack={handleBack}
          shopPath={shopPath}
          inputRef={s.searchInputRef}
          onSelectBranch={choose}
          onDirections={getDirections}
          directionsLoading={nav.loading}
        />
      </aside>
      )}

      {/* Phone / tablet, List view: the whole area is the list (the map stays mounted underneath, so it keeps its place). */}
      {!desktop && view === 'list' && !nav.route && (
        <section aria-label="Shops list" className="absolute inset-0 z-20 flex flex-col bg-canvas lg:hidden">
          <SearchResults s={s} onShowOnMap={pickFromList} className="flex-1 pb-[var(--bottom-nav-space)]" />
        </section>
      )}

      {/* Phone / tablet, search bar tapped: categories, then the recent searches (over the map or the list). */}
      {!desktop && searching && !nav.route && (
        <section aria-label="Search suggestions" className="absolute inset-0 z-40 overflow-y-auto bg-canvas lg:hidden">
          <SearchFocusPanel query={s.q} onPick={pickRecent} onMore={() => setRecentOpen(true)} />
        </section>
      )}
      {recentOpen && <RecentSearchesScreen onBack={() => setRecentOpen(false)} onPick={pickRecent} />}

      {/* Phone / tablet: the chosen shop, full screen over the list or the map (both stay mounted underneath, so Back
          returns to the same place in the list). */}
      {mobileDetail && (
        <section aria-label="Chosen shop" className="absolute inset-0 z-30 flex flex-col bg-surface pb-[var(--bottom-nav-space)] lg:hidden">
          <SearchPanelBody
            s={s}
            onOpenFilter={openFilter}
            onShowOnMap={showOnMap}
            selected={map.selected}
            onBack={handleBack}
            shopPath={shopPath}
            compact
            onSelectBranch={choose}
            onDirections={getDirections}
            directionsLoading={nav.loading}
          />
        </section>
      )}
      {/* Directions mode: From → To with a tab per way of travelling, and (phone/tablet) the answer under the map */}
      {nav.route && (
        <>
          <RouteTopCard route={nav.route} mode={nav.mode} onMode={nav.setMode} onBack={leaveRoute} />
          <div className="absolute inset-x-4 bottom-[var(--bottom-nav-space)] z-20 mx-auto max-w-[var(--col-w)] rounded-[28px] bg-surface p-4 shadow-[0_8px_40px_rgba(45,42,38,0.16)] lg:hidden">
            <RouteSummary route={nav.route} mode={nav.mode} />
          </div>
        </>
      )}

      {/* Map controls: on the map (not over the list), above the shop card on a phone or tablet */}
      {(desktop || (view === 'map' && !mobileDetail)) && <MapControls
        onLocate={locate}
        onZoomIn={map.zoomIn}
        onZoomOut={map.zoomOut}
        locating={map.locating}
        sheetHeight={sheetPx}
      />}

      <HomeFilterSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} value={filters} showMore showLocation onApply={s.applyAllFilters} />
    </div>
    </>
  );
}
