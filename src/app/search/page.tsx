'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Star, Store, Scissors, ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Search, X, RotateCcw,
  TrendingUp, TrendingDown, Minus, MapPin, Clock,
} from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import { applyCategoryFilter } from '@/lib/garmentCategories';
import { CATEGORY_CHIP_SETS, findChipSetKey } from '@/lib/categoryChipSets';
import {
  getSavedLocation,
  saveLocation,
  getOldLocation,
  swapLocations,
  haversineKm,
  type SavedLocation,
} from '@/lib/customerLocation';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { isShopOpen, type OperatingHours } from '@/lib/shopStatus';

// Leaflet touches `window` at import time — must be client-only, same
// pattern as every other Leaflet consumer in this app (BranchesMap,
// SingleBranchMap, DiscoveryMap).
const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

interface RelatedShop {
  id: number;
  slug: string;
  name: string;
  logo_path: string | null;
  banner_path?: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  distance_km?: number | null;
  subscription_plan?: string | null;
  is_featured?: boolean;
  operating_hours?: OperatingHours | null;
  owner?: { id: number; name: string } | null;
  branches?: {
    id: number;
    name: string;
    district: string | null;
    city: string | null;
    latitude: string | null;
    longitude: string | null;
    address?: string;
  }[];
  catalog_items?: {
    id: number;
    name: string;
    price: string | number;
    material?: string | null;
    garment_type?: string | null;
    fabric_image_url?: string | null;
    images?: { id: number; image_url: string; is_primary?: boolean }[];
  }[];
  matching_items_count?: number | null;
}

interface SearchServiceResult {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  base_price: number | null;
  sale_price?: number | null;
  estimated_days?: number | null;
  image_url?: string | null;
  shop?: {
    id: number;
    name: string;
    slug: string;
    logo_path?: string | null;
    banner_path?: string | null;
    operating_hours?: OperatingHours | null;
    subscription_plan?: string | null;
    is_featured?: boolean;
    owner?: { id: number; name: string } | null;
    branches?: {
      id: number;
      name: string;
      district: string | null;
      city: string | null;
      latitude: string | null;
      longitude: string | null;
      address?: string;
    }[];
  } | null;
}

// Real seeded Davao City districts (shop_branches.district) — same list
// already used on /shops and /map, kept in sync manually since it's a
// fixed, small, real-world set rather than a fetched enum.
const DISTRICTS = ['Poblacion', 'Talomo', 'Buhangin', 'Agdao', 'Toril', 'Bunawan', 'Calinan', 'Tugbok'];

// Left-rail tabs of the mobile Filter panel — Category/Price/Rating/District
// are SUTURA's own real filterable dimensions (garment_type, price, review
// rating, branch district). Deliberately not a 1:1 port of the Shopee
// reference's categories (Shipped From/Brand/Shipping Option don't apply —
// there's no shipping or brand concept in this domain).
// No "Category" tab here anymore — the hamburger menu's Men/Women/Wedding
// leaves already deep-link straight into /search with `category` applied,
// so a duplicate category picker inside this panel was redundant.
const FILTER_TABS = [
  { key: 'price', label: 'Price Range' },
  { key: 'rating', label: 'Rating' },
  { key: 'district', label: 'Location' },
  { key: 'color', label: 'Color' },
] as const;
type FilterTabKey = typeof FILTER_TABS[number]['key'];

// Common tailoring/garment colors — a real, functional filter
// (catalog_items.color, matched by substring on the backend so "Blue"
// still catches "Sky Blue"). Sparse today since most seeded items have no
// color set yet, but the filter itself is real, not decorative.
const COLOR_OPTIONS: { label: string; hex: string }[] = [
  { label: 'Black', hex: '#1a1a1a' },
  { label: 'White', hex: '#f5f5f0' },
  { label: 'Navy', hex: '#1e2a4a' },
  { label: 'Blue', hex: '#2244aa' },
  { label: 'Gray', hex: '#8a8a8a' },
  { label: 'Brown', hex: '#6b4a3a' },
  { label: 'Beige', hex: '#d8c9a3' },
  { label: 'Red', hex: '#a12626' },
  { label: 'Green', hex: '#2f5d3a' },
  { label: 'Gold', hex: '#c9a24b' },
];

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-ink-muted">Loading…</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const gate = useGuestGatedHref();
  const searchParams = useSearchParams();
  // `q` holds what's typed in the search box. Initialized from URL `q` or `search`
  // so queries typed on the landing page hero search or links carry over visibly.
  const [q, setQ] = useState(searchParams.get('q') ?? searchParams.get('search') ?? '');
  const effectiveQ = q.trim();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync q when searchParams change (e.g. back/forward navigation or external links)
  useEffect(() => {
    const nextQ = searchParams.get('q') ?? searchParams.get('search') ?? '';
    setQ(nextQ);
  }, [searchParams]);

  // Arriving here drops straight into a ready-to-type state
  useEffect(() => { searchInputRef.current?.focus(); }, []);

  // Initialized from the URL, not just `q` — lets an external link (the
  // hamburger menu's category/price/district drill-down) land here
  // pre-filtered instead of just pre-filling the text box.
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [color, setColor] = useState(searchParams.get('color') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') ?? '');
  const [page, setPage] = useState(1);

  // Measured so the filter dropdown can sit exactly below the header
  // (back/location + search/filter rows) instead of covering it — the
  // header must stay visible and usable while the panel is open.
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  useEffect(() => {
    if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
  }, []);

  // Location picker — full-screen map overlay (see LocationPicker.tsx), not
  // an inline dropdown, so it doesn't need outside-click tracking like the
  // price menu does. Defaults from whatever was saved on a previous visit
  // (localStorage — no backend "home address" field exists, see
  // customerLocation.ts); a fresh visitor sees just "Davao City" until they
  // open the picker themselves.
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [oldLocation, setOldLocation] = useState<SavedLocation | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'all' | 'store' | 'services' | 'showroom'>(
    initialTab === 'services' || initialTab === 'service'
      ? 'services'
      : initialTab === 'showroom' || initialTab === 'catalog'
        ? 'showroom'
        : initialTab === 'store' || initialTab === 'shops'
          ? 'store'
          : 'all'
  );
  const [stores, setStores] = useState<RelatedShop[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [services, setServices] = useState<SearchServiceResult[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesTotal, setServicesTotal] = useState(0);

  useEffect(() => {
    const loc = getSavedLocation();
    setSavedLocation(loc);
    setOldLocation(getOldLocation());
    if (loc?.lat && loc?.lng) {
      setUserCoords({ lat: loc.lat, lng: loc.lng });
    }
    // Only set active filter district if explicitly specified in URL query
    const urlDistrict = searchParams.get('district');
    if (urlDistrict) {
      setDistrict(urlDistrict);
    }
  }, [searchParams]);

  function handleToggleOldLocation() {
    const result = swapLocations();
    if (result?.current) {
      setSavedLocation(result.current);
      setUserCoords({ lat: result.current.lat, lng: result.current.lng });
      setDistrict(result.current.district || '');
      setOldLocation(result.old);
    }
  }

  function handleSortNearest() {
    if (sortBy === 'distance') {
      setSortBy('');
      return;
    }
    if (userCoords) {
      setSortBy('distance');
      return;
    }
    if (!navigator.geolocation) {
      alert('Location is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setSortBy('distance');
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Filter dropdown — draft fields let Reset/Apply preview a change before
  // it's committed. All 4 sections render stacked in one scrollable pane;
  // the left rail highlights whichever section is currently in view
  // (scrollspy) rather than gating content behind a click-to-switch tab.
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTabKey>('price');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftMinRating, setDraftMinRating] = useState('');
  const [draftDistrict, setDraftDistrict] = useState('');
  const [draftColor, setDraftColor] = useState('');

  const filterScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = {
    price: useRef<HTMLDivElement>(null),
    rating: useRef<HTMLDivElement>(null),
    district: useRef<HTMLDivElement>(null),
    color: useRef<HTMLDivElement>(null),
  };

  // getBoundingClientRect()-based, not raw offsetTop — offsetTop is
  // relative to the nearest *positioned* ancestor, which isn't guaranteed
  // to be this scroll container, and was causing the rail's auto-scroll to
  // overshoot past the section it was supposed to land on.
  function sectionTopInContainer(el: HTMLDivElement, container: HTMLDivElement) {
    return el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  }

  function handleFilterScroll() {
    const container = filterScrollRef.current;
    if (!container) return;
    const scrollPos = container.scrollTop + 12;
    let current: FilterTabKey = 'price';
    for (const tab of FILTER_TABS) {
      const el = sectionRefs[tab.key].current;
      if (el && sectionTopInContainer(el, container) <= scrollPos) current = tab.key;
    }
    setActiveFilterTab(current);
  }

  function scrollToFilterSection(key: FilterTabKey) {
    const container = filterScrollRef.current;
    const el = sectionRefs[key].current;
    if (container && el) {
      container.scrollTo({ top: sectionTopInContainer(el, container) - 8, behavior: 'smooth' });
    }
    setActiveFilterTab(key);
  }

  function openFilterPanel() {
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftMinRating(minRating);
    setDraftDistrict(district);
    setDraftColor(color);
    setActiveFilterTab('price');
    setFilterPanelOpen(true);
  }
  function applyFilterPanel() {
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setMinRating(draftMinRating);
    setDistrict(draftDistrict);
    setColor(draftColor);
    setFilterPanelOpen(false);
  }
  function resetFilterPanel() {
    // Also clears the real `category` state directly, not just the price/
    // rating/district/color drafts — there's no picker for it in this
    // panel anymore, but Reset should still mean "clear every active
    // filter", including one that arrived via a hamburger-menu link.
    setCategory('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftMinRating('');
    setDraftDistrict('');
    setDraftColor('');
  }

  const [items, setItems] = useState<CatalogItemResult[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // Model/Fabric toggle — real data (catalog_items.fabric_image_url),
  // falls back to the model photo per-card when an item has no fabric shot.
  const [showFabric, setShowFabric] = useState(false);

  const [relatedShops, setRelatedShops] = useState<RelatedShop[]>([]);

  // Resets to page 1 whenever a filter changes — a stale page 4 selection
  // shouldn't survive a brand-new filter combination.
  useEffect(() => { setPage(1); }, [effectiveQ, category, minPrice, maxPrice, minRating, district, color, sortBy]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string | number> = { per_page: 30, page };
      if (effectiveQ.trim()) params.q = effectiveQ.trim();
      applyCategoryFilter(params, category);
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minRating) params.min_rating = minRating;
      if (district) params.district = district;
      if (color) params.color = color;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }
      if (sortBy) params.sort_by = sortBy;

      api.get('/public/catalog-items', { params })
        .then((res) => {
          setItems(res.data.data ?? []);
          setTotal(res.data.meta?.total ?? 0);
          setLastPage(res.data.meta?.last_page ?? 1);
        })
        .catch(() => { setItems([]); setTotal(0); setLastPage(1); })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [effectiveQ, category, minPrice, maxPrice, minRating, district, color, sortBy, page, userCoords]);

  // Load stores list sorted by distance if userCoords available
  useEffect(() => {
    setStoresLoading(true);
    const handle = setTimeout(() => {
      const params: Record<string, string | number> = { per_page: 30 };
      if (effectiveQ.trim()) params.q = effectiveQ.trim();
      if (district) params.district = district;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        params.sort_by = 'distance';
      }

      api.get('/public/shops', { params })
        .then((res) => {
          let list: RelatedShop[] = res.data.data ?? [];
          if (userCoords) {
            list = list.map((shop) => {
              if (shop.distance_km != null) return shop;
              let minKm: number | null = null;
              if (shop.branches) {
                for (const b of shop.branches) {
                  if (b.latitude && b.longitude) {
                    const d = haversineKm(userCoords.lat, userCoords.lng, Number(b.latitude), Number(b.longitude));
                    if (minKm === null || d < minKm) minKm = d;
                  }
                }
              }
              return { ...shop, distance_km: minKm };
            });
            list.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
          }
          setStores(list);
          setRelatedShops(list.slice(0, 6));
        })
        .catch(() => {
          setStores([]);
          setRelatedShops([]);
        })
        .finally(() => setStoresLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [effectiveQ, district, userCoords]);

  // Load tailoring services matching query
  useEffect(() => {
    setServicesLoading(true);
    const handle = setTimeout(() => {
      const params: Record<string, string | number> = { per_page: 30 };
      if (effectiveQ.trim()) params.q = effectiveQ.trim();
      if (district) params.district = district;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
      }
      if (sortBy) params.sort_by = sortBy;

      api.get('/public/services', { params })
        .then((res) => {
          setServices(res.data.data ?? []);
          setServicesTotal(res.data.meta?.total ?? res.data.data?.length ?? 0);
        })
        .catch(() => {
          setServices([]);
          setServicesTotal(0);
        })
        .finally(() => setServicesLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [effectiveQ, district, userCoords, sortBy]);

  const activeFilterCount = [category, minPrice || maxPrice, minRating, district, color].filter(Boolean).length;

  return (
    <div className="min-h-full flex flex-col bg-canvas animate-fade-page">
      {/* Header: back button + location dropdown + old place shortcut + typeable search */}
      <div ref={headerRef} className="sticky top-0 z-50 bg-taupe shadow-xs">
        <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-1">
          <button
            type="button"
            onClick={() => { if (window.history.length > 1) router.back(); else router.push('/'); }}
            aria-label="Back"
            className="p-1.5 -ml-1 rounded-full text-canvas active:bg-white/10 transition-colors shrink-0"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={() => router.push(`/location${effectiveQ ? `?q=${encodeURIComponent(effectiveQ)}` : ''}`)}
            className="flex-1 min-w-0 py-0.5 group text-left"
          >
            <div className="min-w-0 flex flex-col text-left">
              <span className="text-[11px] font-normal text-canvas/85 truncate block w-full leading-tight">
                {savedLocation?.address || 'Davao City, Philippines'}
              </span>
              <div className="flex items-center gap-1 mt-0.5 max-w-full">
                <span className="text-xs font-medium text-white truncate leading-tight">
                  {savedLocation?.district || district || 'Davao City'}
                </span>
                <ChevronDown size={14} className="text-canvas/80 shrink-0 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {oldLocation ? (
            <button
              type="button"
              onClick={handleToggleOldLocation}
              title={`Switch back to old place: ${oldLocation.address}`}
              className="p-1.5 rounded-full text-canvas hover:bg-white/15 active:scale-95 transition-all shrink-0 flex items-center justify-center"
              aria-label="Switch back to old location"
            >
              <RotateCcw size={18} />
            </button>
          ) : null}
        </div>

        {/* Big wide search bar, filter button removed beside search */}
        <div className="px-3 pb-2.5 pt-1">
          <div className="w-full flex items-center gap-2 h-10 px-3.5 rounded-full bg-white shadow-xs">
            <Search size={17} className="text-taupe shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Barong, Chiffon & tulle, Sublimation, Repair..."
              className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear"
                className="shrink-0 text-ink-faint hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Segmented Tabs: All, Stores, Services, Showroom */}
        <div className="border-t border-white/10 bg-taupe/95 backdrop-blur-sm px-2">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {(['all', 'store', 'services', 'showroom'] as const).map((tab) => {
              const isSelected = activeTab === tab;
              const label =
                tab === 'store'
                  ? 'Stores'
                  : tab === 'services'
                    ? 'Services'
                    : tab === 'showroom'
                      ? 'Catalog'
                      : 'All';
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-2.5 text-xs sm:text-sm font-bold capitalize transition-all border-b-2 -mb-px px-2.5 sm:px-4 ${
                    isSelected
                      ? 'border-white text-white font-extrabold'
                      : 'border-transparent text-white/70 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full px-3 py-3">
        {/* TAB: STORE or ALL (Nearby Stores Row List) */}
        {(activeTab === 'store' || activeTab === 'all') && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base font-bold text-ink">Nearby Stores</h2>
              <span className="text-xs text-ink-muted">
                {stores.length} {stores.length === 1 ? 'result' : 'results'} · nearest first
              </span>
            </div>

            {storesLoading ? (
              <div className="divide-y divide-line border-t border-line">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border-b border-line border-x-0 rounded-none px-0 py-3.5 flex items-center gap-3.5 animate-pulse">
                    <div className="w-14 h-14 rounded-full bg-sunken shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-sunken rounded" />
                      <div className="h-4 w-2/3 bg-sunken rounded" />
                      <div className="h-3 w-1/2 bg-sunken rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className="bg-transparent border-y border-line border-x-0 rounded-none px-0 py-8 text-center text-sm text-ink-muted">
                No tailoring stores matched your search. Try another query or location.
              </div>
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {(activeTab === 'all' ? stores.slice(0, 4) : stores).map((store, index) => {
                  const distKm = store.distance_km != null ? store.distance_km : null;
                  const branch = store.branches?.[0];
                  const districtText = branch?.district || branch?.city || 'Davao City';
                  const imageSrc = store.logo_path || store.banner_path;

                  // Match items specifically for this store based on search
                  const itemsMatchingStore = items.filter(
                    (i) => i.shop?.id === store.id || (i as any).shop_id === store.id
                  );
                  const qLower = effectiveQ.trim().toLowerCase();
                  const matchingCatalogItems = (store.catalog_items || []).filter((item) => {
                    if (!qLower) return true;
                    return (
                      item.name?.toLowerCase().includes(qLower) ||
                      item.garment_type?.toLowerCase().includes(qLower) ||
                      item.material?.toLowerCase().includes(qLower)
                    );
                  });

                  // Prioritize search matches, fallback to general store catalog items
                  const storeCarouselItems = itemsMatchingStore.length > 0
                    ? itemsMatchingStore
                    : (matchingCatalogItems.length > 0 ? matchingCatalogItems : (store.catalog_items ?? []));

                  // Count of items found based on search for this specific store
                  const matchedCount = effectiveQ.trim()
                    ? (store.matching_items_count ?? (itemsMatchingStore.length || matchingCatalogItems.length))
                    : (store.catalog_items?.length ?? storeCarouselItems.length);

                  return (
                    <div
                      key={store.id}
                      className="border-b border-line border-x-0 rounded-none px-0 py-3.5 space-y-2.5"
                    >
                      {/* Top Row: [LogoStore] [nearest,name,ownername,location][>] */}
                      <Link
                        href={gate(`/shop/${store.slug}?tab=catalog${effectiveQ.trim() ? `&q=${encodeURIComponent(effectiveQ.trim())}` : ''}`)}
                        className="flex items-center justify-between gap-3 group active:opacity-80"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-14 h-14 shrink-0">
                            <div className="w-full h-full rounded-full overflow-hidden bg-sunken relative border border-line">
                              {imageSrc ? (
                                <Image
                                  src={getMediaUrl(imageSrc)}
                                  alt={store.name}
                                  fill
                                  unoptimized
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Store size={22} className="text-ink-faint" />
                                </div>
                              )}
                            </div>
                            {/* Open / Closed store status dot */}
                            <span
                              aria-label={isShopOpen(store.operating_hours) ? 'Open now' : 'Closed now'}
                              title={isShopOpen(store.operating_hours) ? 'Open now' : 'Closed now'}
                              className={`absolute -bottom-0.5 -right-0.5 z-10 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                                isShopOpen(store.operating_hours) ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {distKm != null ? (
                                <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                                  {index === 0 ? `NEAREST · ${distKm.toFixed(1)} km` : `${distKm.toFixed(1)} km`}
                                </span>
                              ) : store.subscription_plan === 'premium' || store.is_featured ? (
                                <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                                  ★ FEATURED STORE
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                                  DAVAO CITY
                                </span>
                              )}
                              {store.reviews_avg_rating ? (
                                <span className="text-[10px] font-bold text-ink-muted flex items-center gap-0.5">
                                  <Star size={10} className="fill-current text-taupe" />
                                  {Number(store.reviews_avg_rating).toFixed(1)} ({store.reviews_count ?? 0})
                                </span>
                              ) : null}
                            </div>
                            <h3 className="text-[15px] font-bold text-ink truncate leading-tight group-hover:text-taupe transition-colors">
                              {store.name}
                            </h3>
                            <p className="text-[11px] text-ink-muted truncate">
                              {store.owner?.name ? `by ${store.owner.name}` : `by Tailoring Master`}
                            </p>
                            <p className="text-[11px] text-ink-faint truncate">
                              {districtText} · Davao City
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-ink-faint group-hover:text-ink transition-colors shrink-0" />
                      </Link>

                      {/* Carousel Header: Item count */}
                      {storeCarouselItems.length > 0 && (
                        <div className="px-0.5 pt-0.5">
                          <span className="text-[11px] font-bold text-ink">
                            {effectiveQ.trim()
                              ? `${matchedCount} matching catalog design${matchedCount === 1 ? '' : 's'}`
                              : `Catalog designs (${matchedCount})`}
                          </span>
                        </div>
                      )}

                      {/* Carousel: [All list of base sa search na naca caroucel] */}
                      {storeCarouselItems.length > 0 && (
                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x snap-mandatory">
                          {storeCarouselItems.map((item) => {
                            const itemImg = item.images?.[0]?.image_url || (item as any).primary_image_url || item.fabric_image_url;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => router.push(gate(`/shop/${store.slug}?tab=catalog&item=${item.id}${effectiveQ.trim() ? `&q=${encodeURIComponent(effectiveQ.trim())}` : ''}`))}
                                className="snap-start w-[34%] min-w-[118px] max-w-[142px] sm:w-[130px] shrink-0 text-left group/item rounded-none border-0 bg-transparent transition-all active:scale-[0.98]"
                              >
                                <div className="aspect-square bg-sunken relative overflow-hidden rounded-xs border border-line/60">
                                  {itemImg ? (
                                    <Image
                                      src={getMediaUrl(itemImg)}
                                      alt={item.name}
                                      fill
                                      unoptimized
                                      className="object-cover object-top group-hover/item:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[11px] text-ink-faint">
                                      No photo
                                    </div>
                                  )}
                                  {item.price && (
                                    <div className="absolute bottom-1 right-1 bg-ink/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs">
                                      ₱{Number(item.price).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <div className="pt-1.5 px-0.5 pb-0">
                                  <p className="text-xs font-semibold text-ink truncate leading-tight group-hover/item:text-taupe transition-colors">
                                    {item.name}
                                  </p>
                                  <p className="text-[11px] text-ink-muted truncate mt-0.5">
                                    {item.garment_type || item.material || 'Custom Tailored'}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'store' && (
              <div className="mt-3 py-2.5 px-0 flex items-center gap-2.5 text-ink-muted text-xs border-b border-line/60">
                <MapPin size={14} className="text-taupe shrink-0" />
                <span>Distances are ordered from your current location in Davao City.</span>
              </div>
            )}

            {/* In the Store tab: See all showroom results button */}
            {activeTab === 'store' && (total > 0 || items.length > 0) && (
              <p className="text-center mt-6 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('showroom');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-6 rounded-full border border-line bg-surface hover:bg-sunken text-xs font-bold text-ink hover:text-taupe transition-all active:scale-95 shadow-xs"
                >
                  <span>See all {effectiveQ ? `“${effectiveQ}” ` : ''}results ({total || items.length})</span>
                  <ChevronRight size={14} />
                </button>
              </p>
            )}

            {activeTab === 'all' && stores.length > 4 && (
              <button
                type="button"
                onClick={() => setActiveTab('store')}
                className="w-full mt-3 py-2.5 rounded-xl border border-line bg-surface text-xs font-bold text-taupe hover:bg-sunken transition-colors"
              >
                View all {stores.length} stores →
              </button>
            )}
          </div>
        )}

        {/* TAB: SERVICES or ALL (Tailoring Services Section) */}
        {(activeTab === 'services' || (activeTab === 'all' && (servicesLoading || services.length > 0))) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Scissors size={17} className="text-taupe shrink-0" />
                <h2 className="text-base font-bold text-ink">Tailoring Services</h2>
              </div>
              <span className="text-xs text-ink-muted font-medium">
                {servicesTotal}
              </span>
            </div>

            {servicesLoading ? (
              <div className="divide-y divide-line border-t border-line">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-3.5 flex items-center gap-3.5 animate-pulse">
                    <div className="w-14 h-14 rounded-full bg-sunken shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-sunken rounded" />
                      <div className="h-4 w-2/3 bg-sunken rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="bg-transparent border-y border-line px-0 py-8 text-center text-sm text-ink-muted">
                No tailoring services matched your search.
              </div>
            ) : (() => {
              // Group services by shop — show a store row then service cards carousel
              const displayServices = services;
              const shopOrder: number[] = [];
              const shopMap: Record<number, typeof displayServices> = {};
              for (const svc of displayServices) {
                const sid = svc.shop?.id ?? 0;
                if (!shopMap[sid]) { shopMap[sid] = []; shopOrder.push(sid); }
                shopMap[sid].push(svc);
              }
              return (
                <div className="divide-y divide-line border-t border-line">
                  {shopOrder.map((shopId, shopIndex) => {
                    const shopServices = shopMap[shopId];
                    const matchedStore = stores.find((s) => s.id === shopId);
                    const rawShop = shopServices[0]?.shop;
                    const shopInfo = matchedStore || rawShop;
                    const shopName = shopInfo?.name || 'Tailoring Shop';
                    const shopSlug = shopInfo?.slug || (rawShop as any)?.slug || shopId;
                    const shopHref = gate(`/shop/${shopSlug}?tab=services`);
                    const logoSrc = shopInfo?.logo_path || (shopInfo as any)?.banner_path;
                    const distKm = matchedStore?.distance_km != null ? matchedStore.distance_km : null;
                    const branch = shopInfo?.branches?.[0];
                    const districtText = branch?.district || branch?.city || 'Davao City';
                    const ownerName = shopInfo?.owner?.name;
                    const operatingHours = shopInfo?.operating_hours;
                    const isFeatured = (shopInfo as any)?.subscription_plan === 'premium' || (shopInfo as any)?.is_featured;
                    const rating = matchedStore?.reviews_avg_rating;
                    const reviewsCount = matchedStore?.reviews_count;

                    return (
                      <div key={shopId} className="border-b border-line border-x-0 rounded-none px-0 py-3.5 space-y-3">
                        {/* Store row — same layout as Nearby Stores */}
                        <Link
                          href={shopHref}
                          className="flex items-center justify-between gap-3 group active:opacity-80"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative w-14 h-14 shrink-0">
                              <div className="w-full h-full rounded-full overflow-hidden bg-sunken relative border border-line">
                                {logoSrc ? (
                                  <Image
                                    src={getMediaUrl(logoSrc)}
                                    alt={shopName}
                                    fill
                                    unoptimized
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Store size={22} className="text-ink-faint" />
                                  </div>
                                )}
                              </div>
                              {/* Open / Closed store status dot */}
                              <span
                                aria-label={isShopOpen(operatingHours) ? 'Open now' : 'Closed now'}
                                title={isShopOpen(operatingHours) ? 'Open now' : 'Closed now'}
                                className={`absolute -bottom-0.5 -right-0.5 z-10 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                                  isShopOpen(operatingHours) ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {distKm != null ? (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                                    {shopIndex === 0 ? `NEAREST · ${distKm.toFixed(1)} km` : `${distKm.toFixed(1)} km`}
                                  </span>
                                ) : isFeatured ? (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                                    ★ FEATURED STORE
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                                    DAVAO CITY
                                  </span>
                                )}
                                {rating ? (
                                  <span className="text-[10px] font-bold text-ink-muted flex items-center gap-0.5">
                                    <Star size={10} className="fill-current text-taupe" />
                                    {Number(rating).toFixed(1)} ({reviewsCount ?? 0})
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="text-[15px] font-bold text-ink truncate leading-tight group-hover:text-taupe transition-colors">
                                {shopName}
                              </h3>
                              <p className="text-[11px] text-ink-muted truncate">
                                {ownerName ? `by ${ownerName}` : `by Tailoring Master`}
                              </p>
                              <p className="text-[11px] text-ink-faint truncate">
                                {districtText} · Davao City
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-ink-faint group-hover:text-ink transition-colors shrink-0" />
                        </Link>

                        {/* Service carousel header: matching services count */}
                        {shopServices.length > 0 && (
                          <div className="px-0.5 pt-0.5">
                            <span className="text-[11px] font-bold text-ink">
                              {effectiveQ.trim()
                                ? `${shopServices.length} matching service${shopServices.length === 1 ? '' : 's'}`
                                : `Services (${shopServices.length})`}
                            </span>
                          </div>
                        )}

                        {/* Service cards — 1 and 1/2 card horizontal carousel */}
                        <div className="flex overflow-x-auto gap-2.5 pb-2 pt-1 no-scrollbar snap-x snap-mandatory">
                          {shopServices.map((service) => {
                            const priceDisplay = service.base_price !== null && service.base_price !== undefined
                              ? `₱${Number(service.sale_price ?? service.base_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}`
                              : 'Custom Quote';
                            const serviceHref = gate(`/shop/${shopSlug}?tab=services&service_id=${service.id}`);

                            return (
                              <Link
                                key={service.id}
                                href={serviceHref}
                                className="snap-start shrink-0 w-[205px] bg-surface border border-line hover:border-taupe transition-all duration-300 flex flex-col justify-between overflow-hidden group active:scale-[0.98]"
                              >
                                {/* Top: Picture */}
                                <div className="h-36 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
                                  {service.image_url ? (
                                    <Image
                                      src={getMediaUrl(service.image_url)}
                                      alt={service.name}
                                      fill
                                      unoptimized
                                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-ink-faint">
                                      <Scissors size={24} className="text-taupe/40" />
                                    </div>
                                  )}
                                </div>

                                {/* Bottom: Details (No description) */}
                                <div className="p-2.5 flex-1 flex flex-col justify-between">
                                  <div>
                                    <span className="text-[9px] font-medium uppercase tracking-wide text-taupe truncate block">
                                      {(service as any).category || (service as any).service_type || 'Tailoring Service'}
                                    </span>
                                    <h4 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-0.5 line-clamp-2">
                                      {service.name}
                                    </h4>
                                  </div>

                                  <div className="flex items-center justify-between pt-1.5 border-t border-line/50 mt-2">
                                    <span className="text-xs font-bold text-ink truncate">
                                      {priceDisplay}
                                    </span>

                                    <span className="flex items-center gap-1 text-[10px] text-ink-muted font-medium shrink-0 ml-1">
                                      <Clock size={10} className="text-taupe shrink-0" />
                                      <span>Est. {service.estimated_days ? `${service.estimated_days}d` : '7-10d'}</span>
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: SHOWROOM or ALL (Showroom Section) */}
        {(activeTab === 'showroom' || activeTab === 'all') && (
          <div>
            {activeTab === 'all' && (
              <div className="flex items-center justify-between mb-3 px-1 pt-2 border-t border-line">
                <h2 className="text-base font-bold text-ink">Catalog</h2>
                <span className="text-xs text-ink-muted font-medium">
                  {total}
                </span>
              </div>
            )}

        {/* Quick Sort Bar */}
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-0.5 min-w-0 mb-2.5">
          <button
            type="button"
            onClick={() => setSortBy('')}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
              !sortBy ? 'bg-ink text-white border-ink font-semibold' : 'bg-surface border-line text-ink-muted hover:border-line-strong'
            }`}
          >
            Default
          </button>
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'top_sales' ? '' : 'top_sales')}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
              sortBy === 'top_sales' ? 'bg-ink text-white border-ink font-semibold' : 'bg-surface border-line text-ink-muted hover:border-line-strong'
            }`}
          >
            Top Sales
          </button>
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap flex items-center gap-0.5 ${
              sortBy.startsWith('price') ? 'bg-ink text-white border-ink font-semibold' : 'bg-surface border-line text-ink-muted hover:border-line-strong'
            }`}
          >
            <span>Price</span>
            {sortBy === 'price_asc' && <TrendingUp size={11} className="text-white" />}
            {sortBy === 'price_desc' && <TrendingDown size={11} className="text-white" />}
          </button>
        </div>

        <div className="flex items-center justify-between mb-2 px-0.5">
          <p className="text-[11px] text-ink-faint">
            {loading ? 'Searching…' : null}
          </p>

          {/* Real toggle, not decorative — catalog_items.fabric_image_url
              is a real column CatalogItemCard now reads; falls back to the
              model photo per-card when an item has none. */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[11px] font-semibold ${!showFabric ? 'text-ink' : 'text-ink-faint'}`}>Model</span>
            <button
              type="button"
              onClick={() => setShowFabric((v) => !v)}
              aria-label="Toggle between model and fabric photos"
              className={`relative w-8 h-[18px] rounded-full transition-colors ${showFabric ? 'bg-ink' : 'bg-line-strong'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${showFabric ? 'translate-x-[14px]' : ''}`}
              />
            </button>
            <span className={`text-[11px] font-semibold ${showFabric ? 'text-ink' : 'text-ink-faint'}`}>Fabric</span>
          </div>
        </div>

        {/* Skeleton loading state — same grid breakpoints as the real
            results grid below it, so it doesn't stay a fixed column count
            while the real content collapses under it (established pattern,
            see CLAUDE.md's mobile-responsive notes re: Branches). */}
        {loading && (
          <div className="grid grid-cols-2 gap-[5px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-line bg-surface">
                <div className="aspect-square bg-sunken animate-pulse" />
                <div className="p-2 space-y-1.5">
                  <div className="h-2.5 w-full bg-sunken rounded animate-pulse" />
                  <div className="h-2.5 w-2/3 bg-sunken rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-sunken rounded animate-pulse mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-ink-muted">
            No items matched your search. Try a broader term or clear a filter.
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-[5px]">
              {items.map((item) => (
                <CatalogItemCard key={item.id} item={item} showFabric={showFabric} userCoords={userCoords} />
              ))}
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-line text-ink-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-ink-muted px-2">Page {page} of {lastPage}</span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="p-2 rounded-lg border border-line text-ink-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
          </div>
        )}
      </main>

      {/* Filter dropdown — drops down from below the header (which stays
          visible/usable, not covered) rather than taking over as a full
          "next page". A dark scrim fills the rest of the frame down to the
          real bottom edge so it's clear this is a layer on top of the
          page, not a separate screen. */}
      {filterPanelOpen && (
        <div
          className="fixed left-0 right-0 z-[60] flex flex-col"
          style={{ top: headerHeight, bottom: 0 }}
        >
          <button
            type="button"
            aria-label="Close filter"
            onClick={() => setFilterPanelOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div className="relative bg-canvas rounded-b-2xl shadow-xl flex flex-col max-h-[80%] overflow-hidden">
            <div className="flex items-center justify-between px-3 h-12 border-b border-line shrink-0">
              <span className="text-sm font-bold text-ink">Filter</span>
              <button type="button" onClick={() => setFilterPanelOpen(false)} aria-label="Close" className="p-1.5 text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              <nav className="w-[96px] shrink-0 bg-sunken overflow-y-auto">
                {FILTER_TABS.map((tab) => {
                  const isActive = activeFilterTab === tab.key;
                  const hasValue =
                    (tab.key === 'price' && !!(draftMinPrice || draftMaxPrice)) ||
                    (tab.key === 'rating' && !!draftMinRating) ||
                    (tab.key === 'district' && !!draftDistrict) ||
                    (tab.key === 'color' && !!draftColor);
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => scrollToFilterSection(tab.key)}
                      className={`w-full text-left px-3 py-3 text-xs font-medium border-l-2 transition-colors ${
                        isActive
                          ? 'bg-canvas border-taupe text-ink font-semibold'
                          : 'border-transparent text-ink-muted'
                      }`}
                    >
                      {tab.label}
                      {hasValue && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-taupe align-middle" />}
                    </button>
                  );
                })}
              </nav>

              {/* Single scrollable pane — every section stacked, the left
                  rail's active tab tracks scroll position instead of gating
                  content behind a click. */}
              <div ref={filterScrollRef} onScroll={handleFilterScroll} className="flex-1 overflow-y-auto p-4">
                <div ref={sectionRefs.price}>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Price Range</p>

                  {/* Default/Low to High/High to Low map straight to the
                      real backend sort_by values (price_asc/price_desc) —
                      applied immediately on tap, not gated behind Apply,
                      since a sort isn't a draft the way min/max is. */}
                  <div className="flex items-center gap-2.5 mb-4">
                    {([
                      { key: '', label: 'Default', Icon: Minus },
                      { key: 'price_asc', label: 'Low to High', Icon: TrendingUp },
                      { key: 'price_desc', label: 'High to Low', Icon: TrendingDown },
                    ] as const).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSortBy(opt.key)}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors ${
                          sortBy === opt.key ? 'text-ink' : 'text-ink-faint'
                        }`}
                      >
                        <opt.Icon size={18} />
                        <span className="whitespace-nowrap">{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe"
                    />
                    <span className="text-ink-faint text-sm">–</span>
                    <input
                      type="number"
                      min={0}
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe"
                    />
                  </div>
                </div>

                <div ref={sectionRefs.rating} className="mt-7">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Rating</p>
                  <div className="space-y-1">
                    {['5', '4', '3', '2', '1'].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDraftMinRating(draftMinRating === value ? '' : value)}
                        className={`w-full flex items-center gap-0.5 px-2 py-2 rounded-lg transition-colors ${
                          draftMinRating === value ? 'bg-sunken' : ''
                        }`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= Number(value) ? 'text-taupe fill-taupe' : 'text-line-strong'}
                          />
                        ))}
                        {value !== '5' && <span className="text-xs text-ink-muted ml-1.5">&amp; Up</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div ref={sectionRefs.district} className="mt-7">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Location</p>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                      <input
                        type="checkbox"
                        checked={!draftDistrict}
                        onChange={() => setDraftDistrict('')}
                        className="w-4 h-4 rounded border-line-strong accent-taupe"
                      />
                      <span className={`text-sm ${!draftDistrict ? 'text-taupe font-semibold' : 'text-ink-body'}`}>All Davao City</span>
                    </label>
                    {DISTRICTS.map((d) => (
                      <label key={d} className="flex items-center gap-2.5 cursor-pointer py-1.5">
                        <input
                          type="checkbox"
                          checked={draftDistrict === d}
                          onChange={() => setDraftDistrict(draftDistrict === d ? '' : d)}
                          className="w-4 h-4 rounded border-line-strong accent-taupe"
                        />
                        <span className={`text-sm ${draftDistrict === d ? 'text-taupe font-semibold' : 'text-ink-body'}`}>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div ref={sectionRefs.color} className="mt-7">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Color</p>
                  {/* Real filter (catalog_items.color, substring-matched on
                      the backend) — most seeded items have no color set
                      yet, so this will look sparse until shop owners tag
                      more items, but it's genuinely wired, not decorative. */}
                  <div className="flex flex-wrap gap-3">
                    {COLOR_OPTIONS.map((c) => {
                      const isActive = draftColor === c.label;
                      return (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => setDraftColor(isActive ? '' : c.label)}
                          className="flex flex-col items-center gap-1"
                        >
                          <span
                            className={`w-8 h-8 rounded-full border-2 transition-colors ${isActive ? 'border-taupe' : 'border-line-strong'}`}
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className={`text-[10px] ${isActive ? 'text-taupe font-semibold' : 'text-ink-muted'}`}>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Without this, the last section (District) can't scroll
                    high enough to align with the rail — the container
                    clamps at maxScrollTop once there's nothing left below
                    it to scroll into, so tapping "Location" looked broken
                    even with the getBoundingClientRect() math fixed. */}
                <div className="h-40" aria-hidden="true" />
              </div>
            </div>

            {/* Right after the content — not pinned to the frame's true
                bottom edge, so it doesn't leave a huge empty gap when a
                section (e.g. Category alone) is shorter than the screen. */}
            <div className="flex items-center gap-2.5 px-3 py-3 border-t border-line shrink-0">
              <button
                type="button"
                onClick={resetFilterPanel}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-line-strong text-sm font-semibold text-ink-muted"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <button
                type="button"
                onClick={applyFilterPanel}
                className="flex-1 px-4 py-2.5 rounded-lg bg-taupe text-white text-sm font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {locationPickerOpen && (
        <LocationPicker
          initial={savedLocation}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={(loc) => {
            saveLocation(loc);
            setSavedLocation(loc);
            setDistrict(loc.district);
            setLocationPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
