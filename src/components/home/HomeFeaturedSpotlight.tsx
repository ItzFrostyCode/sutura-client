'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Star, MapPin, Scissors, ChevronLeft, ChevronRight, ChevronRight as Chevron, Eye, Heart, Clock } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { specializationLabel } from '@/lib/storeSpecializations';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { getActiveSale } from '@/lib/salePricing';
import { SERVICE_TYPE_LABELS } from '@/lib/canonicalTaxonomy';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import type { StoreResult } from './homeTypes';

interface HomeFeaturedSpotlightProps {
  readonly stores: StoreResult[];
  readonly loading?: boolean;
}

type Service = NonNullable<StoreResult['services']>[number];

const ESPRESSO = 'bg-[#2E1C14] hover:bg-[#45291D] text-[#FBF4EA]';

/** The main branch (or first): its barangay, else district, else city. */
function shopArea(store: StoreResult): string {
  const branch = store.branches?.find((b) => Boolean(b.is_main)) ?? store.branches?.[0];
  if (!branch) return '';
  return branch.barangay || branch.district || branch.city || '';
}

function serviceTypeLabel(svc: Service): string {
  const raw = svc.service_leaf_type
    ? SERVICE_TYPE_LABELS[svc.service_leaf_type] ?? svc.service_leaf_type
    : svc.service_type || svc.category || 'Tailoring service';
  return raw.replace(/_/g, ' ');
}

/**
 * The signed-in visitor's saved services (for the hearts), plus a toggle.
 * Guests see the counts; tapping a heart asks them to log in.
 */
function useServiceSaves() {
  const { isAuthenticated, hydrated, user } = useAuthStore();
  const signedIn = hydrated && isAuthenticated && !!user;
  const toast = useToast();
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!signedIn) { setSaved(new Set()); return; }
    let cancelled = false;
    api.get('/my-saved-services')
      .then((res) => {
        if (cancelled) return;
        const rows: { id: number }[] = res.data?.data ?? res.data ?? [];
        setSaved(new Set(Array.isArray(rows) ? rows.map((r) => r.id) : []));
      })
      .catch(() => { /* shop accounts can't list saves; hearts just start empty */ });
    return () => { cancelled = true; };
  }, [signedIn]);

  const toggle = async (storeSlug: string, serviceId: number) => {
    if (!signedIn) {
      toast.error('Please log in to save this service.');
      return;
    }
    if (busy !== null) return;
    setBusy(serviceId);
    try {
      const res = await api.post(`/stores/${storeSlug}/services/${serviceId}/save`);
      const isSaved = res.data.status === 'saved';
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(serviceId); else next.delete(serviceId);
        return next;
      });
      if (typeof res.data.saves_count === 'number') {
        setCounts((prev) => ({ ...prev, [serviceId]: res.data.saves_count }));
      }
    } catch {
      toast.error('Failed to update saved status.');
    } finally {
      setBusy(null);
    }
  };

  return { saved, counts, busy, toggle };
}

function ServiceTile({
  svc, storeSlug, href, isSaved, saveCount, saving, onToggleSave, onPreview,
}: Readonly<{
  svc: Service;
  storeSlug: string;
  href: string;
  isSaved: boolean;
  saveCount: number;
  saving: boolean;
  onToggleSave: (slug: string, id: number) => void;
  onPreview: (svc: Service | null) => void;
}>) {
  const sale = svc.base_price != null
    ? getActiveSale({ price: svc.base_price, sale_price: svc.sale_price, sale_starts_at: svc.sale_starts_at, sale_ends_at: svc.sale_ends_at })
    : null;
  const price = svc.base_price != null && Number(svc.base_price) > 0 ? Number(svc.base_price) : null;
  const rating = svc.reviews_avg_rating != null && Number(svc.reviews_avg_rating) > 0 ? Number(svc.reviews_avg_rating) : null;
  const turnaround = formatServiceTurnaround(svc.estimated_days, svc.estimated_days_max);

  return (
    <div
      className="group/tile relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-[0_6px_16px_-6px_rgba(45,42,38,0.18)]"
      onMouseEnter={() => onPreview(svc.image_url ? svc : null)}
      onMouseLeave={() => onPreview(null)}
    >
      <Link href={href} className="flex min-h-0 flex-1 flex-col focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-taupe rounded-xl">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#EFE6DA]">
          {svc.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={getMediaUrl(svc.image_url)}
              alt=""
              className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover/tile:scale-[1.04]"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/shop_storefront.jpg'; }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
              <Scissors size={20} className="text-taupe/50" />
            </span>
          )}
          {sale && (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
              -{sale.percentOff}%
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-0.5 p-2">
          <p className="truncate text-xs font-semibold text-ink group-hover/tile:text-taupe-dark transition-colors" title={`${svc.name} · ${serviceTypeLabel(svc)}`}>{svc.name}</p>
          <p className="text-xs text-ink-body">
            {sale ? (
              <>From <span className="font-bold tabular-nums text-rose-600">₱{sale.sale.toLocaleString()}</span></>
            ) : price !== null ? (
              <>From <span className="font-bold tabular-nums text-ink">₱{price.toLocaleString()}</span></>
            ) : (
              <span className="font-semibold text-ink">Custom quote</span>
            )}
          </p>
          <p className="flex items-center gap-1.5 text-[10px] text-ink-muted">
            <span className="flex items-center gap-0.5">
              <Star size={10} className="fill-[#D9A441] text-[#D9A441]" aria-hidden="true" />
              <span className="font-semibold text-ink tabular-nums">{rating ? rating.toFixed(1) : 'New'}</span>
            </span>
            <span aria-hidden="true" className="h-2.5 w-px bg-line-strong" />
            <span className="tabular-nums">{svc.orders_count ?? 0} sold</span>
            <span aria-hidden="true" className="h-2.5 w-px bg-line-strong" />
            <span className="flex items-center gap-0.5 tabular-nums">
              <Heart size={10} className="fill-rose-500 text-rose-500" aria-hidden="true" />
              <span className="sr-only">Saved by</span>{saveCount}
            </span>
          </p>
          <p className="flex items-center gap-1 pt-0.5 text-[10px] text-ink-muted lg:[@media(max-height:760px)]:hidden" title={turnaround}>
            <Clock size={10} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{svc.estimated_days ? `Est. ${turnaround}` : turnaround}</span>
          </p>
        </div>
      </Link>

      {/* Sibling of the link (not inside it) so the heart is its own control. */}
      <button
        type="button"
        onClick={() => onToggleSave(storeSlug, svc.id)}
        disabled={saving}
        aria-pressed={isSaved}
        aria-label={isSaved ? `Remove ${svc.name} from saved` : `Save ${svc.name}`}
        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_6px_rgba(45,42,38,0.18)] transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-taupe"
      >
        <Heart size={14} className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-ink-body'} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function HomeFeaturedSpotlight({ stores, loading = false }: HomeFeaturedSpotlightProps) {
  const gate = useGuestGatedHref();
  const saves = useServiceSaves();
  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<Service | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Only Premium shops are passed in (premium_only). With none, the section hides.
  const store = stores[index] ?? null;
  const services = useMemo(() => (store?.services ?? []).slice(0, 4), [store]);

  // Auto-rotate every 7 seconds; pauses while the pointer or focus is inside.
  useEffect(() => {
    if (isPaused || stores.length <= 1) return;
    const timer = setInterval(() => {
      setPreview(null);
      setIndex((i) => (i + 1) % stores.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused, stores.length]);

  const header = (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 id="featured-spotlight-title" className="text-display text-xl sm:text-2xl font-semibold text-ink">
        Featured Shops
      </h2>
      <Link
        href="/stores"
        className="inline-flex min-h-11 items-center gap-0.5 text-xs sm:text-sm font-semibold text-taupe-dark hover:text-ink transition-colors"
      >
        Explore all tailors <Chevron size={15} aria-hidden="true" />
      </Link>
    </div>
  );

  if (loading) {
    return (
      <section aria-labelledby="featured-spotlight-title" className="max-w-7xl mx-auto mobile-screen-margins mt-10">
        {header}
        <div className="grid overflow-hidden rounded-2xl border border-line bg-surface animate-pulse lg:h-[clamp(440px,calc(100dvh-190px),540px)] lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-[180px] sm:h-[220px] lg:h-full bg-sunken" />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-sunken" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-sunken" />
                <div className="h-3 w-1/2 rounded bg-sunken" />
              </div>
            </div>
            <div className="grid h-[340px] grid-cols-2 grid-rows-2 gap-2 lg:h-[320px]">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-xl bg-sunken" />)}
            </div>
            <div className="h-11 rounded-lg bg-sunken" />
          </div>
        </div>
      </section>
    );
  }

  if (!store) return null;

  const canCycle = stores.length > 1;
  const go = (step: number) => {
    setPreview(null);
    setIndex((i) => (i + step + stores.length) % stores.length);
  };

  const shopHref = gate(`/store/${store.slug}`);
  const bannerImage = preview?.image_url ?? store.banner_path ?? '/images/hero_banner.jpg';
  const area = shopArea(store);
  const specialties = (store.specializations ?? []).slice(0, 3).map(specializationLabel).join(' · ');
  const rating = store.reviews_avg_rating ? Number(store.reviews_avg_rating) : null;
  const km = store.distance_km != null && !Number.isNaN(Number(store.distance_km)) ? Number(store.distance_km) : null;
  const arrow = 'hidden sm:flex absolute top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-[0_4px_14px_rgba(45,42,38,0.14)] transition-[color,transform] hover:text-taupe-dark active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe';

  return (
    <section
      aria-labelledby="featured-spotlight-title"
      aria-roledescription="carousel"
      className="max-w-7xl mx-auto mobile-screen-margins mt-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => { setIsPaused(false); setPreview(null); }}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {header}

      <div className="relative">
        {canCycle && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous featured shop" className={`${arrow} -left-5`}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}

        {/* Fixed sizes everywhere (photo, header lines, 2x2 grid), so rotating
            between shops with 0, 2 or 7 services never resizes the card. */}
        <div className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(45,42,38,0.04)] lg:h-[clamp(440px,calc(100dvh-190px),540px)] lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left: the shop's showcase photo (or the hovered service's photo). */}
          <div className="relative h-[180px] sm:h-[220px] lg:h-full overflow-hidden bg-sunken">
            <Link href={shopHref} className="absolute inset-0 block group" tabIndex={-1} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={bannerImage}
                src={getMediaUrl(bannerImage)}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] animate-in fade-in duration-300"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/hero_banner.jpg'; }}
              />
            </Link>
            {preview && (
              <div className="pointer-events-none absolute left-3 top-3 flex max-w-[85%] items-center gap-1.5 rounded-lg bg-[#2E1C14]/90 px-3 py-1.5 text-xs font-medium text-[#FBF4EA] shadow-md">
                <Eye size={13} className="shrink-0" aria-hidden="true" />
                <span className="truncate">Preview: {preview.name}</span>
              </div>
            )}
            {canCycle && (
              <div className="sm:hidden absolute right-3 top-3 flex gap-1.5">
                <button type="button" onClick={() => go(-1)} aria-label="Previous featured shop"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-ink shadow-md active:scale-95 cursor-pointer">
                  <ChevronLeft size={17} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next featured shop"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-ink shadow-md active:scale-95 cursor-pointer">
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Right: shop header, 2x2 services, Visit Shop. */}
          <div className="flex min-h-0 flex-col gap-3 border-t border-line p-4 lg:border-l lg:border-t-0">
            <div>
              <div className="flex items-start gap-3">
                <StoreLogoAvatar
                  src={store.logo_path}
                  name={store.name}
                  className="h-10 w-10 rounded-full border border-line bg-surface"
                  textClassName="text-lg font-bold text-taupe"
                />
                <div className="min-w-0 flex-1">
                  <Link href={shopHref} className="block truncate text-base font-semibold leading-snug text-ink hover:text-taupe-dark transition-colors">
                    {store.name}
                  </Link>
                  <p className="truncate text-xs text-ink-muted" title={specialties || undefined}>{specialties || 'Tailoring shop'}</p>
                  <p className="mt-1 flex min-w-0 items-center gap-x-2 overflow-hidden whitespace-nowrap text-xs">
                    <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-ink">
                      <Star size={12} className="fill-[#D9A441] text-[#D9A441]" aria-hidden="true" />
                      {rating ? rating.toFixed(1) : 'New'}
                    </span>
                    <span className="shrink-0 text-ink-muted tabular-nums">
                      ({store.reviews_count ?? 0} {store.reviews_count === 1 ? 'review' : 'reviews'})
                    </span>
                    {area && (
                      <span className="inline-flex min-w-0 items-center gap-0.5 text-ink-muted">
                        <MapPin size={11} className="shrink-0 text-taupe" aria-hidden="true" />
                        <span className="truncate">{area}</span>
                      </span>
                    )}
                    {km !== null && <span className="shrink-0 text-ink-muted tabular-nums">· {km.toFixed(1)} km</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col lg:flex-1">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Services <span className="tabular-nums">({store.services?.length ?? 0})</span>
                </p>
                {services.some((s) => s.image_url) && (
                  <p className="hidden lg:block text-[11px] text-ink-faint">Hover to preview</p>
                )}
              </div>
              {services.length === 0 ? (
                <div className="flex h-[340px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-sunken/50 px-4 text-center lg:h-auto lg:min-h-0 lg:flex-1">
                  <Scissors size={18} className="text-taupe/60" aria-hidden="true" />
                  <p className="text-xs font-medium text-ink-body">No services listed yet</p>
                  <p className="text-[11px] text-ink-muted">Visit the shop to ask what they can make for you.</p>
                </div>
              ) : (
                <div className="grid h-[340px] grid-cols-2 grid-rows-2 gap-2 lg:h-auto lg:min-h-0 lg:flex-1">
                  {services.map((svc) => (
                    <ServiceTile
                      key={svc.id}
                      svc={svc}
                      storeSlug={store.slug}
                      href={gate(`/store/${store.slug}/service/${svc.id}`)}
                      isSaved={saves.saved.has(svc.id)}
                      saveCount={saves.counts[svc.id] ?? svc.saves_count ?? 0}
                      saving={saves.busy === svc.id}
                      onToggleSave={saves.toggle}
                      onPreview={setPreview}
                    />
                  ))}
                  {Array.from({ length: 4 - services.length }).map((_, i) => (
                    <div key={`empty-${i}`} aria-hidden="true" className="rounded-xl border border-dashed border-line bg-sunken/40" />
                  ))}
                </div>
              )}
            </div>

            <Link
              href={shopHref}
              className={`mt-auto inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-lg text-xs font-bold uppercase tracking-[0.14em] transition-colors active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${ESPRESSO}`}
            >
              Visit shop <Chevron size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {canCycle && (
          <button type="button" onClick={() => go(1)} aria-label="Next featured shop" className={`${arrow} -right-5`}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      {canCycle && (
        <div className="mt-3 flex items-center justify-center gap-1">
          {stores.map((s, i) => {
            const active = i === index;
            return (
              <button
                key={s.id ?? i}
                type="button"
                onClick={() => { setPreview(null); setIndex(i); }}
                aria-label={`Show ${s.name}`}
                aria-current={active ? 'true' : undefined}
                className="group flex h-6 items-center px-1 cursor-pointer"
              >
                <span className={`block h-1.5 rounded-full transition-all duration-300 ${active ? 'w-6 bg-[#2E1C14]' : 'w-1.5 bg-line-strong group-hover:bg-taupe'}`} />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
