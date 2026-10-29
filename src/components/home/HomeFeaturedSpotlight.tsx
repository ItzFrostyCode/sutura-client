'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { getMediaUrl } from '@/lib/media';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, categoryOfGarment } from '@/lib/garmentTaxonomy';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { StoreResult } from './homeTypes';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { isStoreOpen } from '@/lib/storeStatus';
import HomeSectionHeader from './HomeSectionHeader';
import FeaturedServiceCard, { orderedServices } from './FeaturedServiceCard';
import { useHoverPreview } from './useHoverPreview';

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

function formatServicePrice(price?: number | string | null): string | null {
  if (price === null || price === undefined || price === '') return null;
  const num = Number(price);
  if (isNaN(num) || num <= 0) return null;
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Featured cards lead with the shop's first service photo (not its banner) — the
// banner is only a last resort when no service or design has a picture.
function getStoreCoverImage(s: StoreResult): string | null {
  const svcImg = orderedServices(s)[0]?.image_url;
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
  const canPreview = useHoverPreview();
  useEffect(() => { if (!canPreview) setHoveredServiceId(null); }, [canPreview]);

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
  const rating = store?.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : null;
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
    return store ? orderedServices(store).slice(0, 4) : [];
  }, [store]);

  const hoveredService = useMemo(() => {
    if (!canPreview || !hoveredServiceId) return null;
    return services.find((s) => s.id === hoveredServiceId) ?? null;
  }, [canPreview, hoveredServiceId, services]);

  const defaultPhoto = useMemo(() => (store ? getStoreCoverImage(store) : null), [store]);

  const heroPhoto = hoveredService?.image_url
    ? getMediaUrl(hoveredService.image_url)
    : defaultPhoto;

  const heroHref = hoveredService
    ? gate(`/store/${storeSlug}/service/${hoveredService.id}`)
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
      <div className="w-full max-w-[960px] mx-auto">
        <HomeSectionHeader
          id="featured-title"
          title={isMulti ? 'Featured Shops' : 'Featured Shop'}
          href="/shops"
          linkLabel="Explore all tailors"
        />
      </div>

      {/* Below xl the card simply fills the page column (same side margins as the sections around it). From xl the row breaks out to the full screen so the neighbouring shops can peek in. */}
      <div className="relative py-2 xl:left-1/2 xl:right-1/2 xl:-ml-[50vw] xl:-mr-[50vw] xl:w-screen xl:max-w-[100vw] xl:overflow-x-clip">
        <div className="relative flex w-full items-center justify-center gap-4 sm:gap-6 md:gap-7 xl:px-5">
          {/* Left Peeking Card (Shown only on xl+ screens where there is room outside the 960px center card) */}
          {isMulti && prevStore && (
            <div
              onClick={() => move(-1)}
              aria-label={`Previous: ${prevStore.name}`}
              className="hidden xl:flex flex-col justify-center items-center shrink-0 w-32 xl:w-48 2xl:w-64 xl:h-[570px] rounded-2xl overflow-hidden relative cursor-pointer opacity-50 hover:opacity-85 transition-all duration-300 scale-95 shadow-xs border border-line bg-surface-sunken group/prev select-none"
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

          {/* Center card. Desktop (lg+): the photo (with the hover preview) on the left, the details on the right, at a fixed height so the arrows never jump and the whole card fits one screen. Tablet and phone: the details only, no photo. */}
          <div className="w-full max-w-[960px] min-w-0 shrink-0 overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-xs lg:flex lg:h-[650px]">
            {/* Left: Large Hero Image Area (desktop only) */}
            <div className="relative hidden min-w-0 flex-1 overflow-hidden bg-surface-sunken lg:block">
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

            {/* Details: shop, services, Visit Shop */}
            <div className="flex w-full flex-col gap-3 bg-white p-4 sm:p-5 lg:w-[420px] lg:shrink-0 lg:border-l lg:border-line">
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
                        <span className="text-ink font-bold">{rating ?? 'New'}</span>
                      </div>
                      <span className="text-ink-muted">({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services: a phone (under 600px) shows the first 2 so the card stays short, a tablet 4 in a row, desktop 2 x 2. Only real services are shown; an empty cell stays empty, so the card keeps its size. */}
              <div className="flex flex-col lg:min-h-0 lg:flex-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    Services ({services.length})
                  </p>
                  <span className="hidden text-[10px] text-ink-faint lg:inline">Hover to preview</span>
                </div>

                <div className="grid grid-cols-2 content-start gap-2 max-sm:[&>*:nth-child(n+3)]:hidden sm:grid-cols-4 lg:grid-cols-2">
                  {services.map((svc) => (
                    <FeaturedServiceCard
                      key={svc.id}
                      service={svc}
                      href={gate(`/store/${storeSlug}/service/${svc.id}`)}
                      hovered={hoveredServiceId === svc.id}
                      saved={savedServiceIds.has(svc.id)}
                      onHoverChange={(on) => { if (canPreview) setHoveredServiceId(on ? svc.id : null); }}
                      onToggleSave={() => toggleSaveService(svc.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom Bar: Visit Shop CTA Button */}
              <div className="shrink-0 border-t border-line pt-3">
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
              className="hidden xl:flex flex-col justify-center items-center shrink-0 w-32 xl:w-48 2xl:w-64 xl:h-[570px] rounded-2xl overflow-hidden relative cursor-pointer opacity-50 hover:opacity-85 transition-all duration-300 scale-95 shadow-xs border border-line bg-surface-sunken group/next select-none"
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
              className="absolute left-0 -translate-x-1/2 lg:-left-5 lg:translate-x-0 xl:left-12 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/95 hover:bg-white text-ink shadow-lg border border-line active:scale-95 transition-all cursor-pointer z-30"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next featured shop"
              className="absolute right-0 translate-x-1/2 lg:-right-5 lg:translate-x-0 xl:right-12 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/95 hover:bg-white text-ink shadow-lg border border-line active:scale-95 transition-all cursor-pointer z-30"
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
