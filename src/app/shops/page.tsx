'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, MapPin, Store, ChevronLeft, ChevronRight, LocateFixed, X, Search, SlidersHorizontal } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import SearchInput from '@/components/shared/SearchInput';
import { SHOP_SPECIALIZATIONS } from '@/lib/shopSpecializations';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isShopOpen, type OperatingHours } from '@/lib/shopStatus';

interface ShopResult {
  id: number;
  slug: string;
  name: string;
  logo_path: string | null;
  banner_path: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  branches: { city: string | null; name: string }[];
  operating_hours?: OperatingHours | string | null;
}

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
];

// Davao City's 8 administrative districts — real values, matching what's
// actually seeded on shop_branches.district (not every district has a shop
// yet, but the list itself is the real set, not a guess).
const DISTRICTS = ['Poblacion', 'Talomo', 'Buhangin', 'Agdao', 'Toril', 'Bunawan', 'Calinan', 'Tugbok'];

// Groups shops by first letter, preserving the order they arrived in
// (already alphabetical from the backend when sort_by=name_asc). Only
// letters that actually have a shop end up as keys — never all 26.
function groupShopsByLetter(shops: ShopResult[]): [string, ShopResult[]][] {
  const groups = new Map<string, ShopResult[]>();
  for (const shop of shops) {
    const letter = shop.name.trim().charAt(0).toUpperCase() || '#';
    const bucket = groups.get(letter);
    if (bucket) bucket.push(shop);
    else groups.set(letter, [shop]);
  }
  return Array.from(groups.entries());
}

function ShopCard({ shop }: { shop: ShopResult }) {
  const gate = useGuestGatedHref();
  return (
    <Link
      href={gate(`/shop/${shop.slug}`)}
      className="bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors"
    >
      <div className="h-28 bg-sunken relative">
        {shop.banner_path ? (
          <Image src={getMediaUrl(shop.banner_path)} alt={shop.name} fill unoptimized className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={24} className="text-ink-faint" />
          </div>
        )}
        <div className="absolute -bottom-5 left-3 w-14 h-14 shrink-0">
          <div className="w-full h-full rounded-full border-2 border-surface bg-surface overflow-hidden relative">
            {shop.logo_path ? (
              <Image src={getMediaUrl(shop.logo_path)} alt="" fill unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sunken">
                <Store size={14} className="text-ink-faint" />
              </div>
            )}
          </div>
          {/* Online / Offline status dot */}
          <span
            aria-label={isShopOpen(shop.operating_hours) ? 'Open now' : 'Closed now'}
            title={isShopOpen(shop.operating_hours) ? 'Open now' : 'Closed now'}
            className={`absolute bottom-0 right-0 z-10 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md ${
              isShopOpen(shop.operating_hours) ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
            }`}
          />
        </div>
      </div>
      <div className="p-3.5 pt-8">
        <h2 className="text-sm font-bold text-ink truncate">{shop.name}</h2>
        {shop.branches[0] && (
          <p className="text-xs text-ink-muted flex items-center gap-1 mt-1 truncate">
            <MapPin size={11} className="shrink-0" />
            {shop.branches[0].city ?? shop.branches[0].name}
          </p>
        )}
        <div className="flex items-center gap-1 mt-2">
          <Star size={12} className="text-taupe fill-taupe" />
          <span className="text-xs font-semibold text-ink">
            {shop.reviews_avg_rating ? Number(shop.reviews_avg_rating).toFixed(1) : 'New'}
          </span>
          <span className="text-xs text-ink-faint">({shop.reviews_count})</span>
        </div>
      </div>
    </Link>
  );
}

export default function ShopsDirectoryPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center text-sm text-ink-muted">Loading…</div>}>
      <ShopsDirectoryContent />
    </Suspense>
  );
}

function ShopsDirectoryContent() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [sortBy, setSortBy] = useState('name_asc');
  const [district, setDistrict] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [page, setPage] = useState(1);

  const [shops, setShops] = useState<ShopResult[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  function handleNearMe() {
    if (userLocation) {
      setUserLocation(null);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location. Check your browser’s location permission and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => { setPage(1); }, [q, sortBy, district, specialization, openNow, userLocation]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string | number> = { per_page: 24, page, sort_by: sortBy };
      if (q.trim()) params.q = q.trim();
      if (district) params.district = district;
      if (specialization) params.specialization = specialization;
      if (openNow) params.open_now = 1;
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.sort_by = 'distance';
      }

      api.get('/public/shops', { params })
        .then((res) => {
          setShops(res.data.data ?? []);
          setTotal(res.data.meta?.total ?? 0);
          setLastPage(res.data.meta?.last_page ?? 1);
        })
        .catch(() => { setShops([]); setTotal(0); setLastPage(1); })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [q, sortBy, district, specialization, openNow, userLocation, page]);

  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="min-h-full flex flex-col bg-canvas">
      {/* Custom Header — Back | All Shops | Search + Filter */}
      <header className="sticky top-0 z-40 bg-surface border-b border-line">
        <div className="h-[50px] flex items-center px-3 gap-2">
          {/* Back */}
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="shrink-0 w-8 h-8 flex items-center justify-center text-ink active:opacity-60 transition-opacity"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Title — centered */}
          <h1 className="flex-1 text-center text-sm font-bold text-ink tracking-wide">All Stores</h1>

          {/* Search + Filter icons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              onClick={() => { const el = document.getElementById('shops-search-input'); el?.focus(); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
              className="w-8 h-8 flex items-center justify-center text-ink active:opacity-60 transition-opacity"
            >
              <Search size={19} />
            </button>
            <button
              type="button"
              aria-label="Filter"
              onClick={() => setFilterOpen((v) => !v)}
              className={`w-8 h-8 flex items-center justify-center transition-opacity active:opacity-60 ${
                filterOpen ? 'text-taupe' : 'text-ink'
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible filter strip */}
        {filterOpen && (
          <div className="px-3 pb-3 border-t border-line/60 space-y-2">
            <SearchInput id="shops-search-input" value={q} onChange={setQ} placeholder="Search store name..." className="w-full" />
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="shrink-0 px-3 py-2 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
              >
                <option value="">All Davao City</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="shrink-0 px-3 py-2 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
              >
                <option value="">All Specializations</option>
                {SHOP_SPECIALIZATIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <label className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-canvas border border-line rounded-lg text-xs text-ink cursor-pointer select-none whitespace-nowrap">
                <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} className="accent-taupe" />
                Open Now
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                disabled={!!userLocation}
                className="shrink-0 px-3 py-2 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe disabled:opacity-50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleNearMe}
                disabled={locating}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-lg whitespace-nowrap transition-colors disabled:opacity-60 ${
                  userLocation
                    ? 'bg-taupe border-taupe text-white hover:bg-taupe-hover'
                    : 'bg-canvas border-line text-ink hover:border-taupe'
                }`}
              >
                <LocateFixed size={14} />
                {locating ? 'Locating…' : userLocation ? 'Near Me: On' : 'Near Me'}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full px-[10px] py-[10px]">

        {locationError && (
          <div className="flex items-start gap-2 mb-4 text-xs text-danger bg-danger/5 border border-danger/20 px-3 py-2">
            <span className="flex-1">{locationError}</span>
            <button type="button" onClick={() => setLocationError('')} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        )}

        {userLocation && (
          <p className="text-xs text-ink-faint mb-4">Sorted by distance from your current location.</p>
        )}

        {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading stores…</div>}

        {!loading && shops.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
            No stores matched your search.
          </div>
        )}

        {!loading && shops.length > 0 && (
          <>
            <p className="text-xs text-ink-faint mb-3">{total} store{total === 1 ? '' : 's'}</p>

            {sortBy === 'name_asc' && !userLocation ? (
              // Real letter-sectioned directory — only letters that actually
              // have a shop get a header; no empty "A" section just because
              // the alphabet has an A. Grouping relies on this page's own
              // results already arriving name-sorted from the backend.
              groupShopsByLetter(shops).map(([letter, group]) => (
                <div key={letter} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-taupe text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {letter}
                    </span>
                    <div className="h-px flex-1 bg-line" />
                  </div>
                  <div className="grid grid-cols-2 gap-[5px]">
                    {group.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-2 gap-[5px]">
                {shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
              </div>
            )}

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-line text-ink-muted hover:bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-ink-muted px-2">Page {page} of {lastPage}</span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="p-2 rounded-lg border border-line text-ink-muted hover:bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
