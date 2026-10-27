'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, LocateFixed, MapPin, SlidersHorizontal, Star, Store } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { haversineKm, type SavedLocation } from '@/lib/customerLocation';
import { formatAddress } from '@/lib/formatAddress';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isStoreOpen } from '@/lib/storeStatus';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import HomeCarouselRow from './HomeCarouselRow';
import type { StoreResult } from './homeTypes';

const RADIUS_MIN = 1;
const RADIUS_MAX = 50;

type Branch = StoreResult['branches'][number];
const num = (v: unknown) => (v === null || v === undefined || v === '' ? NaN : Number(v));

/**
 * The branch the card's distance is measured to (the server's distance_km is
 * to a store's nearest live branch): nearest to the visitor when we know
 * where they are, otherwise the main branch.
 */
function pickBranch(store: StoreResult, location: SavedLocation | null): Branch | null {
  const branches = store.branches ?? [];
  if (branches.length === 0) return null;
  if (location) {
    let best: Branch | null = null;
    let bestKm = Infinity;
    for (const b of branches) {
      const lat = num(b.latitude), lng = num(b.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const km = haversineKm(location.lat, location.lng, lat, lng);
      if (km < bestKm) { bestKm = km; best = b; }
    }
    if (best) return best;
  }
  return branches.find((b) => Boolean(b.is_main)) ?? branches[0];
}

const RADIUS_PRESETS = [2, 5, 10, 20, 50] as const;
const DEFAULT_RADIUS = 10;
const RATINGS = [
  { value: 0, label: 'Any rating' },
  { value: 4, label: '4★ & up' },
  { value: 3, label: '3★ & up' },
];

/**
 * "Stores near you" with its own filters (adviser request, after
 * tarakape.cc): specialty, open now, rating and a search radius. Every filter
 * maps onto a real /public/stores param (StoreController::publicIndex:
 * specialization, open_now, min_rating, lat/lng + radius_km), so the count
 * and list are the server's, not a client-side guess.
 */
export default function HomeStoresGrid({ location }: { readonly location: SavedLocation | null }) {
  const gate = useGuestGatedHref();

  const [specialization, setSpecialization] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [showFilters, setShowFilters] = useState(true);

  const [stores, setStores] = useState<StoreResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nearestKm, setNearestKm] = useState<number | null>(null);

  const filtersActive = specialization !== '' || openNow || minRating > 0 || (location !== null && radius !== DEFAULT_RADIUS);

  // Debounced so dragging the radius slider doesn't fire a request per step.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      const base: Record<string, string | number> = { per_page: 10 };
      if (specialization) base.specialization = specialization;
      if (openNow) base.open_now = 1;
      if (minRating) base.min_rating = minRating;
      if (location) {
        base.lat = location.lat;
        base.lng = location.lng;
      }
      try {
        const res = await api.get('/public/stores', { params: location ? { ...base, radius_km: radius } : base });
        if (cancelled) return;
        const rows: StoreResult[] = res.data.data ?? [];
        setStores(rows);
        setTotal(res.data.meta?.total ?? rows.length);

        // Nothing inside the radius: find how far the nearest match is, so
        // "Expand" can jump straight to a radius that has results.
        if (location && rows.length === 0) {
          const nearest = await api.get('/public/stores', { params: { ...base, per_page: 1 } });
          if (!cancelled) {
            const km = Number(nearest.data.data?.[0]?.distance_km);
            setNearestKm(Number.isFinite(km) ? km : null);
          }
        } else {
          setNearestKm(null);
        }
      } catch {
        if (!cancelled) { setStores([]); setTotal(0); setNearestKm(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(id); };
  }, [location, radius, specialization, openNow, minRating]);

  const expandTo = useMemo(() => {
    if (nearestKm === null) return null;
    return RADIUS_PRESETS.find((p) => p >= nearestKm) ?? Math.ceil(nearestKm);
  }, [nearestKm]);

  const subtitle = loading
    ? 'Searching…'
    : location
      ? `${total} ${total === 1 ? 'shop' : 'shops'} found within ${radius} km`
      : `${total} ${total === 1 ? 'shop' : 'shops'} found — turn on location to see distances`;

  const chip = (active: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center gap-1.5 border px-3 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe disabled:cursor-not-allowed disabled:opacity-40 ${
      active ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-body hover:border-ink'
    }`;
  const activeFilterCount = (specialization ? 1 : 0) + (openNow ? 1 : 0) + (minRating ? 1 : 0) + (location && radius !== DEFAULT_RADIUS ? 1 : 0);
  // Pills and slider share `radius`: a pill jumps the slider; a slider value
  // between presets (e.g. 7 km) simply leaves no pill selected. The fetch
  // effect above already waits 300 ms after the last change, so dragging
  // sends one request when the thumb rests, not one per step.
  const radiusPct = ((Math.min(radius, RADIUS_MAX) - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100;
  const groupLabel = 'mb-2 block text-xs font-medium text-ink-muted';

  return (
    <section aria-labelledby="home-stores-title" className="max-w-7xl mx-auto mobile-screen-margins mt-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="home-stores-title" className="mobile-h2 sm:tablet-h2 text-ink">
            {location ? 'Shops near you' : 'Shops'}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted" aria-live="polite">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/stores" className="hidden sm:flex min-h-11 items-center px-2 text-sm font-semibold text-taupe hover:text-taupe-hover">
            See all →
          </Link>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="home-store-filters"
            className="inline-flex min-h-11 items-center gap-2 bg-taupe px-4 text-sm font-semibold text-white hover:bg-taupe-hover cursor-pointer"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center bg-white px-1 text-[11px] font-bold tabular-nums text-taupe" aria-label={`${activeFilterCount} active`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div id="home-store-filters" className="mb-5 space-y-5 border border-line bg-surface p-4 sm:p-5">
          {/* Specialty: one swipeable line on phones; wraps on wider screens so no chip hides off-edge. */}
          <div role="group" aria-label="Specialty">
            <span className={groupLabel}>Specialty</span>
            <div className="-mx-4 flex gap-2 overflow-x-auto hide-scrollbar px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <button type="button" aria-pressed={specialization === ''} onClick={() => setSpecialization('')} className={chip(specialization === '')}>
                <Store size={13} aria-hidden="true" /> All shops
              </button>
              {STORE_SPECIALIZATIONS.map((s) => (
                <button key={s.value} type="button" aria-pressed={specialization === s.value}
                  onClick={() => setSpecialization(specialization === s.value ? '' : s.value)} className={chip(specialization === s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-x-8 gap-y-5 border-t border-line pt-5">
            <div role="group" aria-label="Availability">
              <span className={groupLabel}>Availability</span>
              <button type="button" aria-pressed={openNow} onClick={() => setOpenNow((v) => !v)} className={chip(openNow)}>
                <Clock size={14} aria-hidden="true" /> Open now
              </button>
            </div>

            <div role="group" aria-label="Rating">
              <span className={groupLabel}>Rating</span>
              <div className="flex gap-1.5">
                {RATINGS.map((r) => (
                  <button key={r.value} type="button" aria-pressed={minRating === r.value} onClick={() => setMinRating(r.value)} className={chip(minRating === r.value)}>
                    {r.value > 0 && <Star size={12} className={minRating === r.value ? 'fill-white' : 'fill-[#D9A441] text-[#D9A441]'} aria-hidden="true" />}
                    {r.value > 0 ? `${r.value}+` : 'Any'}
                  </button>
                ))}
              </div>
            </div>

            <div role="group" aria-label="Search radius" className="min-w-0 flex-1 basis-72">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted">
                  <LocateFixed size={12} className="text-taupe" aria-hidden="true" /> Within
                </span>
                {location && (
                  <span className="text-xs text-ink-muted" aria-hidden="true">
                    Radius: <strong className="font-semibold tabular-nums text-ink">{radius} km</strong>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {RADIUS_PRESETS.map((p) => (
                  <button key={p} type="button" disabled={!location} aria-pressed={location !== null && radius === p} onClick={() => setRadius(p)}
                    className={`${chip(location !== null && radius === p)} tabular-nums`}>
                    {p} km
                  </button>
                ))}
              </div>
              <label htmlFor="home-radius" className="sr-only">Search radius in kilometres</label>
              <input
                id="home-radius"
                type="range"
                min={RADIUS_MIN}
                max={RADIUS_MAX}
                step={1}
                value={Math.min(radius, RADIUS_MAX)}
                disabled={!location}
                onChange={(e) => setRadius(Number(e.target.value))}
                aria-valuetext={`${radius} kilometres`}
                style={{ background: `linear-gradient(to right, #2D2A26 ${radiusPct}%, #E5DDD5 ${radiusPct}%)` }}
                className="radius-slider mt-3 h-1.5 w-full max-w-md cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed disabled:opacity-40"
              />
              {!location && (
                <p className="mt-2 text-xs text-ink-muted">
                  Needs your location. <Link href="/location" className="font-semibold text-taupe underline underline-offset-2">Set location</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,284px))] gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`bg-surface border border-line overflow-hidden animate-pulse ${i >= 2 ? 'hidden sm:block' : ''}`}>
              <div className="h-28 bg-sunken" />
              <div className="p-3.5 pt-8 space-y-2">
                <div className="h-4 w-3/4 bg-sunken rounded" />
                <div className="h-3.5 w-1/2 bg-sunken rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center border border-line bg-surface px-4 py-10 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sunken">
            <Store size={24} className="text-taupe" aria-hidden="true" />
          </span>
          <p className="font-semibold text-ink">{location ? 'No shops nearby' : 'No shops match these filters'}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {location ? `Nothing within ${radius} km of you${filtersActive ? ' with these filters' : ''}.` : 'Try a different specialty or turn off a filter.'}
          </p>
          {expandTo !== null && nearestKm !== null && (
            <button type="button" onClick={() => setRadius(expandTo)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 bg-taupe px-5 text-sm font-semibold text-white hover:bg-taupe-hover cursor-pointer">
              <MapPin size={15} aria-hidden="true" /> Nearest is {nearestKm.toFixed(1)} km — Expand
            </button>
          )}
        </div>
      ) : (
        <HomeCarouselRow>
          {stores.map((store) => {
            const open = isStoreOpen(store.operating_hours);
            const rating = store.reviews_avg_rating ? Number(store.reviews_avg_rating) : null;
            const km = store.distance_km != null && !Number.isNaN(Number(store.distance_km)) ? Number(store.distance_km) : null;
            const branch = pickBranch(store, location);
            const isMain = branch ? Boolean(branch.is_main) : true;
            const fullAddress = branch ? formatAddress(branch) || branch.name : '';
            return (
              <Link
                key={store.id}
                href={gate(`/store/${store.slug}`)}
                className="group flex h-full w-[236px] shrink-0 snap-start flex-col bg-surface border border-line overflow-hidden transition-[border-color,box-shadow] duration-200 ease-out hover:border-line-strong hover:shadow-[0_4px_14px_rgba(45,42,38,0.08)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
              >
                <div className="relative h-28 shrink-0 overflow-hidden bg-[#EFE6DA]">
                  {store.banner_path ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getMediaUrl(store.banner_path)}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/hero_banner.jpg';
                      }}
                    />
                  ) : (
                    // No cover photo yet: a stitched frame with the shop's initial, not a bare icon on grey.
                    <div className="absolute inset-2.5 flex items-center justify-center border border-dashed border-taupe/40">
                      <span className="text-display text-3xl text-taupe/45" aria-hidden="true">
                        {(store.name || 'S').trim().charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Same colours as the map pins: deep brown = main store, taupe = branch. */}
                  <span
                    className={`absolute left-2 top-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      isMain ? 'bg-[#2E1C14] text-white' : 'border border-[#8D7B68] bg-[#F3EEE8] text-[#5E4E40]'
                    }`}
                  >
                    {isMain ? 'Main Shop' : 'Branch'}
                  </span>
                  <span className={`absolute right-2 top-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${open ? 'bg-surface text-sage' : 'bg-surface text-danger'}`}>
                    {open ? 'Open' : 'Closed'}
                  </span>
                  <div className="absolute -bottom-5 left-3">
                    <StoreLogoAvatar
                      src={store.logo_path}
                      name={store.name}
                      className="w-14 h-14 rounded-full border-2 border-surface bg-surface shadow-xs"
                      textClassName="text-base font-bold text-taupe"
                      isOpen={open}
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-3.5 pt-7">
                  <h3 className="mobile-h4 text-ink truncate group-hover:text-taupe transition-colors" title={store.name}>
                    {store.name}
                  </h3>
                  {branch && (
                    <p className="mobile-caption mt-1 flex min-w-0 items-center gap-1 font-normal text-ink-muted">
                      <MapPin size={12} className="shrink-0 text-taupe" aria-hidden="true" />
                      <span className="min-w-0 truncate" title={fullAddress}>{fullAddress}</span>
                      {km !== null && <span className="shrink-0 whitespace-nowrap tabular-nums text-ink-faint">· {km.toFixed(1)} km away</span>}
                    </p>
                  )}
                  <p className="mt-auto flex items-center gap-1 pt-2 text-xs">
                    {rating ? (
                      <>
                        <Star size={13} className="fill-[#D9A441] text-[#D9A441]" aria-hidden="true" />
                        <span className="font-semibold text-ink tabular-nums">{rating.toFixed(1)}</span>
                        <span className="text-ink-faint tabular-nums">({store.reviews_count} {store.reviews_count === 1 ? 'review' : 'reviews'})</span>
                      </>
                    ) : (
                      <span className="text-ink-muted">No ratings yet</span>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </HomeCarouselRow>
      )}
    </section>
  );
}
