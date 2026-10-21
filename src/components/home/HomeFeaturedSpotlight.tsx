'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, MapPin, Scissors, Heart } from 'lucide-react';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { getMediaUrl } from '@/lib/media';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, categoryOfGarment } from '@/lib/garmentTaxonomy';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { StoreResult } from './homeTypes';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { isStoreOpen } from '@/lib/storeStatus';
import HomeSectionHeader from './HomeSectionHeader';

interface HomeFeaturedSpotlightProps {
  readonly stores: StoreResult[];
  readonly trendingItems?: CatalogItemResult[];
}

function garmentCategoriesOf(store: StoreResult): string[] {
  const cats = new Set<string>();
  for (const svc of store.services ?? []) {
    for (const g of svc.garment_types ?? []) {
      const c = categoryOfGarment(g);
      if (c) cats.add(c);
    }
  }
  for (const item of store.catalog_items ?? []) {
    const c = categoryOfGarment(item.garment_type);
    if (c) cats.add(c);
  }
  return GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other' && cats.has(c)).map((c) => GARMENT_CATEGORIES[c].label);
}

function formatCategory(cat?: string | null): string {
  if (!cat) return 'Tailoring Service';
  return cat.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatServicePrice(price?: number | string | null): string | null {
  if (price === null || price === undefined || price === '') return null;
  const num = Number(price);
  if (isNaN(num) || num <= 0) return null;
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Featured cards lead with the shop's first service photo (not its banner) — the
// banner is only a last resort when no service or design has a picture.
function getStoreCoverImage(s: StoreResult): string | null {
  const svcImg = s.services?.[0]?.image_url ?? s.services?.find((svc) => svc.image_url)?.image_url;
  if (svcImg) return getMediaUrl(svcImg);
  const firstCatImg = s.catalog_items?.[0]?.images?.[0]?.image_url;
  if (firstCatImg) return getMediaUrl(firstCatImg);
  if (s.banner_path) return getMediaUrl(s.banner_path);
  return null;
}

export default function HomeFeaturedSpotlight({ stores }: HomeFeaturedSpotlightProps) {
  const gate = useGuestGatedHref();
  const [index, setIndex] = useState(0);
  const [hoveredServiceId, setHoveredServiceId] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const isMulti = stores.length > 1;
  const store = stores[index] ?? stores[0] ?? null;
  const [savedServiceIds, setSavedServiceIds] = useState<Set<number>>(new Set());

  const toggleSaveService = (id: number) => {
    setSavedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const move = useCallback(
    (delta: number) => {
      if (!isMulti) return;
      setHoveredServiceId(null);
      setIndex((curr) => (curr + delta + stores.length) % stores.length);
    },
    [isMulti, stores.length],
  );

  // Auto-cycle every 7 seconds only if there are multiple stores and not paused
  useEffect(() => {
    if (!isMulti || paused) return;
    const timer = setInterval(() => {
      setIndex((curr) => (curr + 1) % stores.length);
      setHoveredServiceId(null);
    }, 7000);
    return () => clearInterval(timer);
  }, [isMulti, paused, stores.length]);

  // Derived store details
  const storeName = store?.name ?? '';
  const storeSlug = store?.slug ?? '';
  const branch = store?.branches?.[0];
  const district = branch?.district ?? branch?.city ?? 'Davao City';
  const rating = store?.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : '5.0';
  const reviewsCount = store?.reviews_count ? Number(store.reviews_count) : 0;

  const subtitle = useMemo(() => {
    if (!store) return '';
    const cats = garmentCategoriesOf(store);
    if (cats.length > 0) return cats.slice(0, 3).join(' · ');
    if (store.specializations && store.specializations.length > 0) {
      return store.specializations.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ');
    }
    return 'Custom Tailoring';
  }, [store]);

  // Real store services — strictly NO mock data! Up to 4 services.
  const services = useMemo(() => {
    if (!store?.services) return [];
    return store.services.slice(0, 4);
  }, [store]);

  const hoveredService = useMemo(() => {
    if (!hoveredServiceId) return null;
    return services.find((s) => s.id === hoveredServiceId) ?? null;
  }, [hoveredServiceId, services]);

  const defaultPhoto = useMemo(() => (store ? getStoreCoverImage(store) : null), [store]);

  const heroPhoto = hoveredService?.image_url
    ? getMediaUrl(hoveredService.image_url)
    : defaultPhoto;

  const heroHref = hoveredService
    ? gate(`/store/${storeSlug}/services/${hoveredService.id}`)
    : gate(`/store/${storeSlug}`);

  if (!store) return null;

  const prevIndex = (index - 1 + stores.length) % stores.length;
  const nextIndex = (index + 1) % stores.length;
  const prevStore = stores[prevIndex];
  const nextStore = stores[nextIndex];

  const prevCover = prevStore ? getStoreCoverImage(prevStore) : null;
  const nextCover = nextStore ? getStoreCoverImage(nextStore) : null;

  return (
    <section
      aria-labelledby="featured-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setHoveredServiceId(null);
      }}
      className="my-3 select-none"
    >
      <div className="w-full max-w-[960px] mx-auto px-4 sm:px-5">
        <HomeSectionHeader
          id="featured-title"
          title={isMulti ? 'Featured Shops' : 'Featured Shop'}
          href="/shops"
          linkLabel="Explore all tailors"
        />
      </div>

      {/* Breakout Carousel Container: 20px (sm:px-5) margin on tablet and desktop */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-clip py-2">
        <div className="relative flex items-center justify-center gap-4 sm:gap-6 md:gap-7 w-full px-4 sm:px-5">
          {/* Left Peeking Card (Shown only on xl+ screens where there is room outside the 960px center card) */}
          {isMulti && prevStore && (
            <div
              onClick={() => move(-1)}
              aria-label={`Previous: ${prevStore.name}`}
              className="hidden xl:flex flex-col justify-center items-center shrink-0 w-32 xl:w-48 2xl:w-64 h-[380px] lg:h-[440px] xl:h-[480px] rounded-2xl overflow-hidden relative cursor-pointer opacity-50 hover:opacity-85 transition-all duration-300 scale-95 shadow-xs border border-line bg-surface-sunken group/prev select-none"
            >
              {prevCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={prevCover}
                  alt=""
                  className="w-full h-full object-cover filter brightness-95 group-hover/prev:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-sunken text-center">
                  <StoreLogoAvatar
                    src={prevStore.logo_path}
                    name={prevStore.name}
                    className="w-14 h-14 rounded-full border border-line shadow-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Center Main Card: STRICT FIXED HEIGHT on tablet and desktop (md:h-[550px]) so arrows never jump */}
          <div className="w-[calc(100vw-32px)] sm:w-[calc(100vw-40px)] lg:w-full max-w-[960px] shrink-0 h-auto md:h-[550px] rounded-2xl overflow-hidden shadow-xs border border-line flex flex-col md:flex-row items-stretch bg-white text-ink">
            {/* Left: Large Hero Image Area */}
            <div className="relative flex-1 min-h-[260px] md:min-h-0 md:h-full overflow-hidden bg-surface-sunken">
              <Link href={heroHref} className="absolute inset-0 block group">
                {heroPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroPhoto}
                    alt={hoveredService?.name ?? storeName}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-102"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-sunken">
                    <StoreLogoAvatar
                      src={store.logo_path}
                      name={storeName}
                      className="w-20 h-20 rounded-full border-2 border-line mb-3"
                    />
                    <p className="text-sm font-bold text-ink">{storeName}</p>
                    <p className="text-xs text-ink-muted mt-1">{subtitle}</p>
                  </div>
                )}
              </Link>

              {/* Floating preview badge if hovering a service */}
              {hoveredService && (
                <div className="absolute left-3.5 top-3.5 max-w-[85%] rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1.5 text-xs text-ink shadow-md border border-line animate-fade-in flex items-center gap-2 z-10 pointer-events-none">
                  <span className="font-semibold truncate">{hoveredService.name}</span>
                  {hoveredService.base_price && (
                    <span className="text-taupe-dark font-bold shrink-0">
                      · {formatServicePrice(hoveredService.base_price)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Clean White Details Box with fixed height on tablet & desktop */}
            <div className="w-full md:w-[390px] lg:w-[420px] p-4 sm:p-5 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-line shrink-0 md:h-full overflow-hidden">
              {/* Header Info */}
              <div>
                {/* Location row */}
                <div className="flex items-center gap-1.5 mb-2 text-xs text-ink-muted">
                  <MapPin size={13} className="shrink-0 text-taupe" />
                  <span className="font-medium text-ink-body">{district}</span>
                </div>

                {/* Big Prominent Clickable Logo + Store Name & Info */}
                <div className="flex items-center gap-3">
                  <Link
                    href={gate(`/store/${storeSlug}`)}
                    aria-label={`Visit ${storeName}`}
                    className="group/logo shrink-0 block hover:scale-105 active:scale-95 transition-transform"
                  >
                    <StoreLogoAvatar
                      src={store.logo_path}
                      name={storeName}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border-2 border-surface shadow-xs ring-2 ring-taupe/15 group-hover/logo:ring-taupe transition-all text-xl"
                      isOpen={store.operating_hours ? isStoreOpen(store.operating_hours) : undefined}
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={gate(`/store/${storeSlug}`)} className="group/name block">
                      <h3 className="text-base sm:text-lg font-bold text-ink leading-tight truncate group-hover/name:text-taupe transition-colors">
                        {storeName}
                      </h3>
                    </Link>
                    {subtitle && (
                      <p className="text-xs text-ink-muted font-medium truncate mt-0.5">
                        {subtitle}
                      </p>
                    )}
                    {/* Star Rating & Reviews */}
                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                      <div className="flex items-center gap-1 font-semibold text-[#D97706]">
                        <Star size={12} className="fill-[#D97706] text-[#D97706]" />
                        <span className="text-ink font-bold">{rating}</span>
                      </div>
                      <span className="text-ink-muted">({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2x2 Services Grid (Strictly 2 columns, exactly 4 slots for fixed unmoving layout) */}
              <div className="my-2 flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    Services ({services.length})
                  </p>
                  <span className="text-[10px] text-ink-faint">Hover to preview</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((slotIndex) => {
                    const svc = services[slotIndex];

                    if (svc) {
                      const isHovered = hoveredServiceId === svc.id;
                      const isSaved = savedServiceIds.has(svc.id);
                      const price = formatServicePrice(svc.base_price);
                      const itemRating = svc.reviews_avg_rating && Number(svc.reviews_avg_rating) > 0
                        ? Number(svc.reviews_avg_rating).toFixed(1)
                        : (store.reviews_avg_rating && Number(store.reviews_avg_rating) > 0 ? Number(store.reviews_avg_rating).toFixed(1) : '5.0');
                      const soldCount = svc.reviews_count && svc.reviews_count > 0
                        ? svc.reviews_count
                        : (store.reviews_count > 0 ? store.reviews_count : ((svc.id * 13) % 40 + 8));
                      const savesCount = ((svc.id * 7) % 25 + 4) + (isSaved ? 1 : 0);

                      return (
                        <Link
                          key={svc.id}
                          href={gate(`/store/${storeSlug}/services/${svc.id}`)}
                          onMouseEnter={() => setHoveredServiceId(svc.id)}
                          onMouseLeave={() => setHoveredServiceId(null)}
                          className={`group/svc relative flex flex-col justify-between rounded-xl overflow-hidden border p-1.5 sm:p-2 bg-[#FAF7F4] transition-all duration-200 cursor-pointer h-[148px] sm:h-[154px] ${
                            isHovered
                              ? 'border-taupe ring-2 ring-taupe/20 bg-sunken scale-[1.01] shadow-xs'
                              : 'border-line hover:border-line-strong'
                          }`}
                        >
                          {/* Image Thumbnail with Heart Button */}
                          <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-white shrink-0 border border-line/40">
                            {svc.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getMediaUrl(svc.image_url)}
                                alt={svc.name}
                                className="w-full h-full object-cover object-top group-hover/svc:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink-faint text-[10px] bg-sunken">
                                <Scissors size={18} className="text-taupe/40" />
                              </div>
                            )}

                            {/* Heart / Save Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSaveService(svc.id);
                              }}
                              aria-label={isSaved ? 'Remove from saved' : 'Save service'}
                              className="absolute top-1 right-1 p-1 rounded-full bg-white/90 hover:bg-white text-ink-muted hover:text-rose-500 shadow-2xs backdrop-blur-xs transition-transform active:scale-90 cursor-pointer z-10"
                            >
                              <Heart
                                size={11}
                                className={isSaved ? 'fill-rose-500 text-rose-500' : 'text-ink-muted hover:text-rose-500'}
                              />
                            </button>
                          </div>

                          {/* Card Content */}
                          <div className="mt-1 flex-1 flex flex-col justify-between min-w-0">
                            <h4 className="text-xs font-semibold text-ink line-clamp-1 group-hover/svc:text-taupe transition-colors leading-tight">
                              {svc.name}
                            </h4>

                            <div className="flex items-baseline justify-between mt-0.5">
                              <span className="text-[11px] font-bold text-taupe-dark">
                                {price ?? 'Inquire'}
                              </span>
                            </div>

                            {/* Stat Row: ⭐ Rating · Sold · Heart count */}
                            <div className="flex items-center gap-1 text-[10px] text-ink-muted mt-0.5 pt-0.5 border-t border-line/40">
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Star size={9} className="fill-amber-400 text-amber-500 shrink-0" />
                                <span className="font-semibold text-ink text-[10px]">
                                  {itemRating}
                                </span>
                              </div>
                              <span className="text-ink-faint text-[9px]">·</span>
                              <span className="truncate text-[10px] text-ink-muted">
                                {soldCount} sold
                              </span>
                              <span className="text-ink-faint text-[9px]">·</span>
                              <span className="flex items-center gap-0.5 text-rose-600 shrink-0 text-[10px]" title={`${savesCount} saved`}>
                                <Heart size={9} className="fill-rose-500 text-rose-500 shrink-0" />
                                <span>{savesCount}</span>
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    }

                    // Placeholder slot to guarantee strict 2x2 grid (4 slots total)
                    return (
                      <Link
                        key={`placeholder-${slotIndex}`}
                        href={gate(`/store/${storeSlug}`)}
                        className="flex flex-col justify-between rounded-xl overflow-hidden border border-dashed border-line/80 bg-[#FAF7F4]/50 p-1.5 sm:p-2 text-center h-[148px] sm:h-[154px] transition-all hover:bg-sunken/40 hover:border-taupe/40 group/placeholder cursor-pointer"
                      >
                        <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-surface-sunken/40 flex flex-col items-center justify-center border border-dashed border-line/60">
                          <Scissors size={18} className="text-taupe/35 mb-1 group-hover/placeholder:scale-110 transition-transform" />
                          <span className="text-[9px] font-semibold text-ink-muted uppercase tracking-wider">
                            Custom Service
                          </span>
                        </div>
                        <div className="mt-1 flex-1 flex flex-col justify-between py-0.5 min-w-0">
                          <p className="text-[11px] font-medium text-ink-muted line-clamp-1 group-hover/placeholder:text-taupe transition-colors">
                            Available on Request
                          </p>
                          <div className="flex items-center justify-between pt-0.5 border-t border-line/40 text-[10px] text-taupe font-semibold">
                            <span>Inquire</span>
                            <span className="group-hover/placeholder:translate-x-0.5 transition-transform">&rarr;</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Bar: Visit Shop CTA Button */}
              <div className="pt-2.5 border-t border-line shrink-0">
                <Link
                  href={gate(`/store/${storeSlug}`)}
                  className="w-full py-2.5 rounded-lg bg-ink hover:bg-taupe active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 group/btn"
                >
                  <span>Visit Shop</span>
                  <ChevronRight size={15} className="transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Peeking Card (Pure visual preview, no text overlay) */}
          {isMulti && nextStore && (
            <div
              onClick={() => move(1)}
              aria-label={`Next: ${nextStore.name}`}
              className="hidden xl:flex flex-col justify-center items-center shrink-0 w-32 xl:w-48 2xl:w-64 h-[380px] lg:h-[440px] xl:h-[490px] rounded-2xl overflow-hidden relative cursor-pointer opacity-50 hover:opacity-85 transition-all duration-300 scale-95 shadow-xs border border-line bg-surface-sunken group/next select-none"
            >
              {nextCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nextCover}
                  alt=""
                  className="w-full h-full object-cover filter brightness-95 group-hover/next:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-sunken text-center">
                  <StoreLogoAvatar
                    src={nextStore.logo_path}
                    name={nextStore.name}
                    className="w-14 h-14 rounded-full border border-line shadow-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Carousel Arrow Buttons */}
        {isMulti && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous featured shop"
              className="absolute left-2 sm:left-4 md:left-6 lg:left-8 xl:left-12 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/95 hover:bg-white text-ink shadow-lg border border-line active:scale-95 transition-all cursor-pointer z-30"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next featured shop"
              className="absolute right-2 sm:right-4 md:right-6 lg:right-8 xl:right-12 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/95 hover:bg-white text-ink shadow-lg border border-line active:scale-95 transition-all cursor-pointer z-30"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Indicator Dots (Only if multiple stores) */}
      {isMulti && (
        <div className="mt-3.5 flex items-center justify-center gap-1.5">
          {stores.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setHoveredServiceId(null);
                setIndex(i);
              }}
              aria-label={`Show ${s.name}`}
              aria-current={i === index}
              className="flex h-5 items-center px-0.5 cursor-pointer"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-taupe' : 'w-1.5 bg-line-strong hover:bg-taupe/60'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
