'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { getMediaUrl } from '@/lib/media';
import { designPriceLabel } from '@/lib/designPricing';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, categoryOfGarment } from '@/lib/garmentTaxonomy';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { StoreResult } from './homeTypes';
import { getStoreThumbnails, type ThumbnailItem } from './featuredThumbnails';
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

export default function HomeFeaturedSpotlight({ stores, trendingItems = [] }: HomeFeaturedSpotlightProps) {
  const gate = useGuestGatedHref();
  const [index, setIndex] = useState(0);
  const [hoveredThumb, setHoveredThumb] = useState<ThumbnailItem | null>(null);
  const [paused, setPaused] = useState(false);

  const isMulti = stores.length > 1;
  const store = stores[index] ?? stores[0] ?? null;

  const move = useCallback(
    (delta: number) => {
      if (!isMulti) return;
      setHoveredThumb(null);
      setIndex((curr) => (curr + delta + stores.length) % stores.length);
    },
    [isMulti, stores.length],
  );

  // Auto-cycle every 7 seconds only if there are multiple stores
  useEffect(() => {
    if (!isMulti || paused) return;
    const timer = setInterval(() => move(1), 7000);
    return () => clearInterval(timer);
  }, [isMulti, paused, move]);

  // Derived store details
  const storeName = store?.name ?? 'Thread & Needle Tailoring';
  const storeSlug = store?.slug ?? 'thread-needle';
  const branch = store?.branches?.[0];
  const district = branch?.district ?? branch?.city ?? 'Poblacion, Davao City';
  const rating = store?.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : '5.0';
  const reviewsCount = store?.reviews_count ? Number(store.reviews_count) : 24;

  const subtitle = useMemo(() => {
    if (!store) return 'Barong · Traditional Filipino Wear · Uniforms';
    const cats = garmentCategoriesOf(store);
    if (cats.length > 0) return cats.slice(0, 3).join(' · ');
    return 'Barong · Traditional Filipino Wear · Uniforms';
  }, [store]);

  // Real 4 thumbnails from store catalog items + trending items
  const thumbnails = useMemo(() => {
    if (!store) return [];
    const items = getStoreThumbnails(store, trendingItems);
    if (items.length >= 4) return items.slice(0, 4);

    const fallbacks: ThumbnailItem[] = [
      { id: 53, name: "Women's Tailored Power Suit", price: 7500, imageUrl: '/images/categories/women_suit.jpg' },
      { id: 52, name: 'Modern Filipiniana Terno Top', price: 3800, imageUrl: '/images/categories/filipiniana.jpg' },
      { id: 54, name: "Women's Tailored Office Blazer", price: 3200, imageUrl: '/images/categories/blazer.jpg' },
      { id: 51, name: 'Tailored Casual Day Dress', price: 1800, imageUrl: '/images/categories/dress.jpg' },
    ];

    const merged = [...items];
    for (const fb of fallbacks) {
      if (merged.length >= 4) break;
      if (!merged.some((m) => m.id === fb.id || m.name === fb.name)) {
        merged.push(fb);
      }
    }
    return merged.slice(0, 4);
  }, [store, trendingItems]);

  const startingPrice = useMemo(() => {
    if (!store) return 'From ₱850';
    const prices: number[] = [];
    for (const item of store.catalog_items ?? []) {
      const amt = item.pricing?.amount ?? (item.price != null ? Number(item.price) : null);
      if (amt && amt > 0) prices.push(amt);
    }
    if (prices.length > 0) {
      const min = Math.min(...prices);
      return `From ₱${min.toLocaleString('en-PH')}`;
    }
    return 'From ₱850';
  }, [store]);

  if (!store) return null;

  // Hero photo logic: hovered thumbnail takes precedence, else store banner, else fallback
  const heroPhoto = hoveredThumb
    ? getMediaUrl(hoveredThumb.imageUrl)
    : store.banner_path
      ? getMediaUrl(store.banner_path)
      : '/images/hero_banner.jpg';

  const heroHref = hoveredThumb
    ? gate(`/store/${storeSlug}/catalog/${hoveredThumb.id}`)
    : gate(`/search?store=${storeSlug}`);

  const prevIndex = (index - 1 + stores.length) % stores.length;
  const nextIndex = (index + 1) % stores.length;
  const prevStore = stores[prevIndex];
  const nextStore = stores[nextIndex];

  return (
    <section
      aria-labelledby="featured-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setHoveredThumb(null);
      }}
      className="my-3 select-none"
    >
      <HomeSectionHeader
        id="featured-title"
        title={isMulti ? 'Featured Shops' : 'Featured Shop'}
        href="/shops"
        linkLabel="Explore all tailors"
      />

      <div className="relative w-full overflow-hidden py-1">
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 w-full">
          {/* Left Peeking Card (Only if multiple stores) */}
          {isMulti && prevStore && (
            <div
              onClick={() => move(-1)}
              aria-label={`Previous: ${prevStore.name}`}
              className="hidden sm:block shrink-0 w-16 md:w-28 lg:w-40 h-[280px] md:h-[350px] lg:h-[400px] rounded-2xl overflow-hidden relative cursor-pointer opacity-40 hover:opacity-70 transition-all duration-300 scale-95 shadow-xs border border-line bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(prevStore.banner_path) || '/images/hero_banner.jpg'}
                alt=""
                className="w-full h-full object-cover filter brightness-95"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}

          {/* Main Card: Full-Bleed Hero Image, Natural Height, Visible Bottom Bar */}
          <div className="flex-1 max-w-[960px] h-auto sm:min-h-[460px] md:min-h-[480px] rounded-2xl overflow-hidden shadow-xs border border-line flex flex-col sm:flex-row items-stretch bg-white text-ink">
            {/* Left: Large Hero Image Area (Full Bleed, Never Black) */}
            <div className="relative flex-1 min-h-[220px] sm:min-h-full overflow-hidden bg-surface-sunken">
              <Link href={heroHref} className="absolute inset-0 block group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={heroPhoto}
                  src={heroPhoto}
                  alt={hoveredThumb?.name ?? storeName}
                  className="w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-102"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/catalog/Bespoke_Suits2.jpg';
                  }}
                />
              </Link>

              {/* Floating preview badge if hovering a thumbnail */}
              {hoveredThumb && (
                <div className="absolute left-3.5 top-3.5 max-w-[85%] rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1.5 text-xs text-ink shadow-md border border-line animate-fade-in flex items-center gap-2 z-10">
                  <span className="font-semibold truncate">{hoveredThumb.name}</span>
                  <span className="text-taupe font-bold">
                    · {designPriceLabel(hoveredThumb.pricing, hoveredThumb.price)}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Clean White Details Box */}
            <div className="w-full sm:w-[350px] md:w-[380px] lg:w-[400px] p-4 sm:p-5 flex flex-col justify-between bg-white border-t sm:border-t-0 sm:border-l border-line shrink-0">
              {/* Header Info */}
              <div>
                {/* Location row */}
                <div className="flex items-center gap-1.5 mb-2.5 text-xs text-ink-muted">
                  <MapPin size={13} className="shrink-0 text-taupe" />
                  <span className="font-medium text-ink-body">{district}</span>
                </div>

                {/* Big Prominent Clickable Logo + Store Name & Info */}
                <div className="flex items-center gap-3 sm:gap-3.5">
                  {store.logo_path && (
                    <Link
                      href={gate(`/search?store=${storeSlug}`)}
                      aria-label={`Visit ${storeName}`}
                      className="group/logo w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-line bg-surface shrink-0 shadow-xs ring-2 ring-taupe/15 hover:ring-taupe hover:scale-105 active:scale-95 transition-all cursor-pointer block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getMediaUrl(store.logo_path)}
                        alt={storeName}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover/logo:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={gate(`/search?store=${storeSlug}`)} className="group/name block">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-ink leading-snug truncate group-hover/name:text-taupe transition-colors">
                        {storeName}
                      </h3>
                    </Link>
                    <p className="text-xs text-ink-muted font-medium truncate mt-0.5">
                      {subtitle}
                    </p>
                    {/* Star Rating & Reviews */}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                      <div className="flex items-center gap-1 font-semibold text-[#D97706]">
                        <Star size={13} className="fill-[#D97706] text-[#D97706]" />
                        <span className="text-ink font-bold">{rating}</span>
                      </div>
                      <span className="text-ink-muted">({reviewsCount} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Signature Work Thumbnails (Full-Bleed, Framed Naturally, No Awkward Letterboxing) */}
              <div className="my-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    Signature Works (4)
                  </p>
                  <span className="text-[10px] text-ink-faint">Hover to preview</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-2 gap-2">
                  {thumbnails.map((thumb) => {
                    const isHovered = hoveredThumb?.id === thumb.id;
                    return (
                      <Link
                        key={thumb.id}
                        href={gate(`/store/${storeSlug}/catalog/${thumb.id}`)}
                        onMouseEnter={() => setHoveredThumb(thumb)}
                        onMouseLeave={() => setHoveredThumb(null)}
                        className={`relative aspect-[3/4] sm:aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF7F4] cursor-pointer transition-all duration-200 block border ${
                          isHovered
                            ? 'ring-2 ring-taupe border-taupe scale-102 shadow-md'
                            : 'border-line hover:border-border-hover shadow-2xs'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getMediaUrl(thumb.imageUrl)}
                          alt={thumb.name}
                          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/categories/suit.jpg';
                          }}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Bar: Visit Shop CTA Button */}
              <div className="pt-3 border-t border-line shrink-0">
                <Link
                  href={gate(`/search?store=${storeSlug}`)}
                  className="w-full py-2.5 rounded-lg bg-ink hover:bg-taupe active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 group/btn"
                >
                  <span>Visit Shop</span>
                  <ChevronRight size={15} className="transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Peeking Card (Only if multiple stores) */}
          {isMulti && nextStore && (
            <div
              onClick={() => move(1)}
              aria-label={`Next: ${nextStore.name}`}
              className="hidden sm:block shrink-0 w-16 md:w-28 lg:w-40 h-[280px] md:h-[350px] lg:h-[400px] rounded-2xl overflow-hidden relative cursor-pointer opacity-40 hover:opacity-70 transition-all duration-300 scale-95 shadow-xs border border-line bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(nextStore.banner_path) || '/images/hero_banner.jpg'}
                alt=""
                className="w-full h-full object-cover filter brightness-95"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}
        </div>

        {/* Carousel Arrow Buttons (Only if multiple stores) */}
        {isMulti && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous featured shop"
              className="absolute left-1 sm:left-4 md:left-8 lg:left-14 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface hover:bg-canvas text-ink shadow-md border border-line active:scale-95 transition-all z-20 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next featured shop"
              className="absolute right-1 sm:right-4 md:right-8 lg:right-14 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface hover:bg-canvas text-ink shadow-md border border-line active:scale-95 transition-all z-20 cursor-pointer"
            >
              <ChevronRight size={20} />
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
                setHoveredThumb(null);
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
