'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock, MapPin, SlidersHorizontal, Star, Store } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { haversineKm, type SavedLocation } from '@/lib/customerLocation';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';
import { uniformTypeLabel } from '@/lib/uniformTypes';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isStoreOpen } from '@/lib/storeStatus';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import HomeCarouselRow from './HomeCarouselRow';
import type { StoreResult } from './homeTypes';

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

/** null = Any distance. */
const RADIUS_PRESETS = [2, 5, 10, 20] as const;
// The slider covers 1–50 km; a value between presets (e.g. 7 km) just leaves no pill selected.
const RADIUS_MIN = 1;
const RADIUS_MAX = 50;
const RATINGS = [
  { value: 0, label: 'Any' },
  { value: 4, label: '4+' },
  { value: 3, label: '3+' },
];

/**
 * "Shops near you" with its own filters (adviser request, after
 * tarakape.cc): specialty, open now, rating and distance. Every filter maps
 * onto a real /public/stores param (StoreController::publicIndex:
 * specialization, open_now, min_rating, lat/lng + radius_km), so the count
 * and list are the server's, not a client-side guess.
 */
export default function HomeStoresGrid({ location }: { readonly location: SavedLocation | null }) {
  const gate = useGuestGatedHref();

  const [specialization, setSpecialization] = useState('');
  // Under "Uniform": the kind of uniform (PNP, BFP, school…), from the types shops actually offer.
  const [uniformType, setUniformType] = useState('');
  const [uniformTypes, setUniformTypes] = useState<{ value: string; shops: number }[]>([]);
  const pickSpecialization = (value: string) => { setSpecialization(value); setUniformType(''); };
  useEffect(() => {
    if (specialization !== 'uniform') return;
    let cancelled = false;
    api.get('/public/uniform-types')
      .then((res) => { if (!cancelled) setUniformTypes(res.data.data ?? []); })
      .catch(() => { if (!cancelled) setUniformTypes([]); });
    return () => { cancelled = true; };
  }, [specialization]);
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [radius, setRadius] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [stores, setStores] = useState<StoreResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nearestKm, setNearestKm] = useState<number | null>(null);

  const withinKm = location ? radius : null;
  const filtersActive = specialization !== '' || openNow || minRating > 0 || withinKm !== null;
  const activeFilterCount = (specialization ? 1 : 0) + (openNow ? 1 : 0) + (minRating ? 1 : 0) + (withinKm !== null ? 1 : 0);

  // Debounced so quick taps across pills send one request.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      const base: Record<string, string | number> = { per_page: 10 };
      if (specialization) base.specialization = specialization;
      if (specialization === 'uniform' && uniformType) base.uniform_type = uniformType;
      if (openNow) base.open_now = 1;
      if (minRating) base.min_rating = minRating;
      if (location) {
        base.lat = location.lat;
        base.lng = location.lng;
      }
      try {
        const res = await api.get('/public/stores', { params: withinKm !== null ? { ...base, radius_km: withinKm } : base });
        if (cancelled) return;
        const rows: StoreResult[] = res.data.data ?? [];
        setStores(rows);
        setTotal(res.data.meta?.total ?? rows.length);

        // Nothing inside the distance: find how far the nearest match is, so
        // "Expand" can jump straight to a distance that has results.
        if (withinKm !== null && rows.length === 0) {
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
    }, 250);
    return () => { cancelled = true; clearTimeout(id); };
  }, [location, withinKm, specialization, uniformType, openNow, minRating]);

  // The smallest preset that reaches the nearest match; beyond 20 km, Any.
  const expandTo = useMemo<number | null>(() => {
    if (nearestKm === null) return null;
    return RADIUS_PRESETS.find((p) => p >= nearestKm) ?? null;
  }, [nearestKm]);

  const count = `${total} ${total === 1 ? 'shop' : 'shops'}`;
  const subtitle = loading
    ? 'Searching…'
    : withinKm !== null
      ? `${count} within ${withinKm} km`
      : location
        ? `${count}, nearest first`
        : `${count} found. Turn on location to see distances.`;

  const pill = (active: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe disabled:cursor-not-allowed disabled:opacity-40 ${
      active ? 'border-[#2E1C14] bg-[#2E1C14] text-[#FBF4EA]' : 'border-line bg-surface text-ink-body hover:border-ink-faint hover:text-ink'
    }`;
  const groupLabel = 'mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted';
  const pillRow = '-mx-4 flex gap-2 overflow-x-auto hide-scrollbar px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0';

  return (
    <section aria-labelledby="home-stores-title" className="max-w-7xl mx-auto mobile-screen-margins mt-12">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="home-stores-title" className="text-display text-xl sm:text-2xl font-semibold text-ink">
            {location ? 'Shops near you' : 'Shops'}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted" aria-live="polite">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/stores" className="hidden sm:inline-flex min-h-11 items-center gap-0.5 px-1 text-sm font-semibold text-taupe-dark hover:text-ink transition-colors">
            See all <ChevronRight size={15} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="home-store-filters"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2E1C14] px-4 text-sm font-semibold text-[#FBF4EA] hover:bg-[#45291D] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            {showFilters ? 'Hide filters' : 'Filters'}
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-[#FBF4EA] px-1 text-[11px] font-bold tabular-nums text-[#2E1C14]" aria-label={`${activeFilterCount} active`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
      <div id="home-store-filters" className="mb-5 space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div role="group" aria-label="Specialty">
          <div className={pillRow}>
            <button type="button" aria-pressed={specialization === ''} onClick={() => pickSpecialization('')} className={pill(specialization === '')}>
              <Store size={13} aria-hidden="true" /> All shops
            </button>
            {STORE_SPECIALIZATIONS.map((s) => (
              <button key={s.value} type="button" aria-pressed={specialization === s.value}
                onClick={() => pickSpecialization(specialization === s.value ? '' : s.value)} className={pill(specialization === s.value)}>
                {s.label}
              </button>
            ))}
          </div>
          {specialization === 'uniform' && uniformTypes.length > 0 && (
            <div role="group" aria-label="Uniform type" className="mt-3">
              <span className={groupLabel}>Uniform type</span>
              <div className={pillRow}>
                <button type="button" aria-pressed={uniformType === ''} onClick={() => setUniformType('')} className={pill(uniformType === '')}>
                  All uniforms
                </button>
                {uniformTypes.map((t) => (
                  <button key={t.value} type="button" aria-pressed={uniformType === t.value}
                    onClick={() => setUniformType(uniformType === t.value ? '' : t.value)} className={pill(uniformType === t.value)}>
                    {uniformTypeLabel(t.value)}
                    <span className="font-normal opacity-70 tabular-nums">{t.shops}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-start gap-x-8 gap-y-4 border-t border-line pt-4">
          <div role="group" aria-label="Availability">
            <span className={groupLabel}>Availability</span>
            <button type="button" aria-pressed={openNow} onClick={() => setOpenNow((v) => !v)} className={pill(openNow)}>
              <Clock size={14} aria-hidden="true" /> Open now
            </button>
          </div>

          <div role="group" aria-label="Rating">
            <span className={groupLabel}>Rating</span>
            <div className="flex gap-1.5">
              {RATINGS.map((r) => (
                <button key={r.value} type="button" aria-pressed={minRating === r.value} onClick={() => setMinRating(r.value)}
                  aria-label={r.value ? `${r.value} stars and up` : 'Any rating'} className={pill(minRating === r.value)}>
                  {r.label}
                  {r.value > 0 && <Star size={12} className={minRating === r.value ? 'fill-[#E9C46A] text-[#E9C46A]' : 'fill-[#D9A441] text-[#D9A441]'} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Distance" className="min-w-0 flex-1 basis-72">
            <div className="mb-2 flex max-w-md items-center justify-between gap-3">
              <span className={`${groupLabel} mb-0!`}>Within</span>
              {location && (
                <span className="text-xs text-ink-muted" aria-hidden="true">
                  Radius: <strong className="font-semibold tabular-nums text-ink">{withinKm === null ? 'Any' : `${withinKm} km`}</strong>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" aria-pressed={withinKm === null} onClick={() => setRadius(null)} className={pill(withinKm === null)}>
                Any
              </button>
              {RADIUS_PRESETS.map((p) => (
                <button key={p} type="button" disabled={!location} aria-pressed={withinKm === p} onClick={() => setRadius(p)}
                  className={`${pill(withinKm === p)} tabular-nums`}>
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
              value={withinKm ?? RADIUS_MAX}
              disabled={!location}
              onChange={(e) => setRadius(Number(e.target.value))}
              aria-valuetext={withinKm === null ? 'Any distance' : `${withinKm} kilometres`}
              style={{ background: `linear-gradient(to right, #2D2A26 ${(((withinKm ?? RADIUS_MAX) - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100}%, #E5DDD5 ${(((withinKm ?? RADIUS_MAX) - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100}%)` }}
              className="radius-slider mt-3 h-1.5 w-full max-w-md cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed disabled:opacity-40"
            />
            {!location && (
              <p className="mt-2 text-xs text-ink-muted">
                Distance needs your location. <Link href="/location" className="font-semibold text-taupe-dark underline underline-offset-2">Set location</Link>
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[236px] shrink-0 overflow-hidden rounded-xl border border-line bg-surface animate-pulse">
              <div className="h-28 bg-sunken" />
              <div className="space-y-2 p-3 pt-7">
                <div className="h-4 w-3/4 rounded bg-sunken" />
                <div className="h-3.5 w-1/2 rounded bg-sunken" />
              </div>
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-4 py-10 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sunken">
            <Store size={24} className="text-taupe" aria-hidden="true" />
          </span>
          <p className="font-semibold text-ink">{withinKm !== null ? 'No shops nearby' : 'No shops match these filters'}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {withinKm !== null ? `Nothing within ${withinKm} km of you${filtersActive ? ' with these filters' : ''}.` : 'Try a different specialty or turn off a filter.'}
          </p>
          {withinKm !== null && nearestKm !== null && (
            <button type="button" onClick={() => setRadius(expandTo)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2E1C14] px-5 text-sm font-semibold text-[#FBF4EA] hover:bg-[#45291D] cursor-pointer">
              <MapPin size={15} aria-hidden="true" /> Nearest is {nearestKm.toFixed(1)} km. {expandTo ? `Show within ${expandTo} km` : 'Show all'}
            </button>
          )}
        </div>
      ) : (
        <HomeCarouselRow className="pb-1">
          {stores.map((store) => {
            const open = isStoreOpen(store.operating_hours);
            const rating = store.reviews_avg_rating ? Number(store.reviews_avg_rating) : null;
            const km = store.distance_km != null && !Number.isNaN(Number(store.distance_km)) ? Number(store.distance_km) : null;
            const branch = pickBranch(store, location);
            const area = branch ? branch.barangay || branch.district || branch.city || branch.name : '';
            return (
                <Link
                  key={store.id}
                  href={gate(`/store/${store.slug}`)}
                  className="group flex w-[236px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-line bg-surface transition-[border-color,box-shadow] duration-200 ease-out hover:border-line-strong hover:shadow-[0_6px_18px_-6px_rgba(45,42,38,0.18)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
                >
                  <div className="relative h-24 sm:h-28 shrink-0 bg-[#EFE6DA]">
                    <div className="absolute inset-0 overflow-hidden">
                      {store.banner_path ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getMediaUrl(store.banner_path)}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/hero_banner.jpg'; }}
                        />
                      ) : (
                        // No cover photo yet: a stitched frame with the shop's initial.
                        <div className="absolute inset-2.5 flex items-center justify-center rounded-md border border-dashed border-taupe/40">
                          <span className="text-display text-3xl text-taupe/45" aria-hidden="true">
                            {(store.name || 'S').trim().charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`absolute right-2 top-2 rounded-md bg-surface/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${open ? 'text-sage' : 'text-danger'}`}>
                      {open ? 'Open' : 'Closed'}
                    </span>
                    <div className="absolute -bottom-5 left-3">
                      <StoreLogoAvatar
                        src={store.logo_path}
                        name={store.name}
                        className="h-11 w-11 rounded-full border-2 border-surface bg-surface shadow-[0_2px_6px_rgba(45,42,38,0.14)]"
                        textClassName="text-sm font-bold text-taupe"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-3 pt-7">
                    <h3 className="truncate text-sm font-semibold text-ink group-hover:text-taupe-dark transition-colors" title={store.name}>
                      {store.name}
                    </h3>
                    {area && (
                      <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-ink-muted">
                        <MapPin size={11} className="shrink-0 text-taupe" aria-hidden="true" />
                        <span className="min-w-0 truncate">{area}</span>
                        {km !== null && <span className="shrink-0 tabular-nums text-ink-faint">· {km.toFixed(1)} km</span>}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs">
                      <span className="flex min-w-0 items-center gap-1">
                        <Star size={12} className="shrink-0 fill-[#D9A441] text-[#D9A441]" aria-hidden="true" />
                        <span className="font-semibold text-ink tabular-nums">{rating ? rating.toFixed(1) : 'New'}</span>
                        <span className="truncate text-ink-faint tabular-nums">({store.reviews_count ?? 0})</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-taupe-dark">
                        Visit <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
            );
          })}
        </HomeCarouselRow>
      )}
    </section>
  );
}
