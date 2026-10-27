'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Star, MapPin, Scissors, Crown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { formatAddress } from '@/lib/formatAddress';
import type { StoreResult } from './homeTypes';

interface HomeFeaturedSpotlightProps {
  readonly stores: StoreResult[];
  readonly loading?: boolean;
}

interface ThumbnailItem {
  id: number;
  name: string;
  price?: number | string | null;
  imageUrl: string | null;
}

/** Up to 4 of the featured shop's own services (photo, name, starting price). */
function getStoreServices(store: StoreResult | null): ThumbnailItem[] {
  if (!store?.services) return [];
  return store.services.slice(0, 4).map((svc) => ({
    id: svc.id,
    name: svc.name,
    price: svc.base_price,
    imageUrl: svc.image_url ?? null,
  }));
}

/** The shop's full address: its main branch (or first), as street, barangay, district, city. */
function shopAddress(store: StoreResult): string {
  const branch = store.branches?.find((b) => Boolean(b.is_main)) ?? store.branches?.[0];
  if (!branch) return '';
  return formatAddress(branch) || branch.city || branch.name;
}

export default function HomeFeaturedSpotlight({ stores, loading = false }: HomeFeaturedSpotlightProps) {
  const gate = useGuestGatedHref();
  const [index, setIndex] = useState(0);
  const [hoveredPreview, setHoveredPreview] = useState<ThumbnailItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Only Premium shops are passed in (premium_only). No stand-in from
  // trending items — with no Premium shop the whole section hides.
  const store = stores[index] ?? null;

  // Up to 4 of the shop's services for the right-hand grid
  const thumbnails = useMemo(() => getStoreServices(store), [store]);

  // Auto-rotate every 7 seconds, pauses on hover
  useEffect(() => {
    if (isPaused || stores.length <= 1) return;
    const timer = setInterval(() => {
      setHoveredPreview(null);
      setIndex((i) => (i + 1) % stores.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused, stores.length]);

  if (loading) {
    return (
      <section aria-labelledby="featured-spotlight-title" className="max-w-7xl mx-auto mobile-screen-margins mt-8 sm:mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="mobile-overline sm:tablet-overline text-taupe" id="featured-spotlight-title">
            Featured &amp; Recommended
          </p>
        </div>
        <div className="bg-surface border border-line overflow-hidden animate-pulse">
          <div className="flex flex-col lg:flex-row h-auto lg:h-[450px] xl:h-[460px]">
            {/* Left large banner skeleton */}
            <div className="w-full lg:flex-1 h-[220px] sm:h-[300px] lg:h-full bg-sunken" />
            {/* Right panel skeleton */}
            <div className="w-full lg:w-[380px] xl:w-[410px] shrink-0 p-4 sm:p-5 bg-surface border-t lg:border-t-0 lg:border-l border-line flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="h-6 w-3/4 bg-sunken rounded" />
                <div className="h-4 w-1/2 bg-sunken rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2 my-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[16/10] bg-sunken border border-line" />
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-line shrink-0">
                <div className="h-4 w-20 bg-sunken rounded" />
                <div className="h-9 w-24 bg-sunken rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!store) return null;

  const canCycle = stores.length > 1;
  const goPrev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setHoveredPreview(null);
    setIndex((i) => (i - 1 + stores.length) % stores.length);
  };
  const goNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setHoveredPreview(null);
    setIndex((i) => (i + 1) % stores.length);
  };

  const currentBannerImage = hoveredPreview?.imageUrl ?? store.banner_path ?? '/images/hero_banner.jpg';

  return (
    <section
      aria-labelledby="featured-spotlight-title"
      className="max-w-7xl mx-auto mobile-screen-margins mt-8 sm:mt-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        setHoveredPreview(null);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="mobile-overline sm:tablet-overline text-taupe tracking-wider uppercase font-semibold" id="featured-spotlight-title">
          Featured &amp; Recommended
        </p>
        <Link
          href="/stores"
          className="text-xs font-semibold text-taupe hover:text-taupe-hover min-h-[44px] flex items-center gap-1 transition-colors"
        >
          <span>Explore All Tailors</span>
          <span>→</span>
        </Link>
      </div>

      {/* Main Steam-Style Card Container with Side Navigation Arrows */}
      <div className="relative group/spotlight">
        {/* Left Arrow Button */}
        {canCycle && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous featured shop"
            className="hidden sm:flex absolute -left-4 lg:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-surface border border-line shadow-md text-ink hover:text-taupe hover:border-line-hover transition-all z-20 cursor-pointer active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* The Card */}
        <div className="bg-surface border border-line shadow-xs overflow-hidden transition-all duration-300">
          <div className="flex flex-col lg:flex-row h-auto lg:h-[450px] xl:h-[460px]">
            {/* ─── LEFT: Big Hero Banner / Dynamic Artwork Preview ─── */}
            <div className="relative w-full lg:flex-1 h-[220px] sm:h-[300px] lg:h-full bg-sunken overflow-hidden group">
              <Link href={gate(`/store/${store.slug}`)} className="absolute inset-0 block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={currentBannerImage}
                  src={getMediaUrl(currentBannerImage)}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/hero_banner.jpg';
                  }}
                />
                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent pointer-events-none" />

                {/* Hover Preview Indicator (shows when hovering any 2x2 thumbnail) */}
                {hoveredPreview ? (
                  <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-ink/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 shadow-md animate-in fade-in duration-200">
                    <Eye size={13} className="text-amber-400 shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-[320px]">
                      Preview: {hoveredPreview.name}
                    </span>
                    {hoveredPreview.price && (
                      <span className="font-bold text-amber-300 ml-1 shrink-0">
                        ₱{Number(hoveredPreview.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                ) : null}

                {/* Mobile / Left Banner Bottom Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white flex items-end justify-between gap-3 pointer-events-none">
                  <div>
                    <h3 className="mobile-h2 sm:tablet-h2 text-white drop-shadow-sm truncate">
                      {store.name}
                    </h3>
                  </div>

                  {/* Mobile Quick Action Pill */}
                  <div className="lg:hidden pointer-events-auto">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-xs font-semibold rounded-none border border-white/30 transition-colors">
                      Visit Shop →
                    </span>
                  </div>
                </div>
              </Link>

              {/* Mobile Prev/Next Overlay Arrows */}
              {canCycle && (
                <div className="sm:hidden absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous shop"
                    className="w-8 h-8 flex items-center justify-center bg-ink/70 backdrop-blur-sm text-white border border-white/20 rounded-xs cursor-pointer active:scale-95"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next shop"
                    className="w-8 h-8 flex items-center justify-center bg-ink/70 backdrop-blur-sm text-white border border-white/20 rounded-xs cursor-pointer active:scale-95"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* ─── RIGHT: Shop details + 2x2 Services grid ─── */}
            <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-surface border-t lg:border-t-0 lg:border-l border-line p-4 sm:p-5 flex flex-col justify-between">
              {/* Header: Title + Rating + full address */}
              <div>
                <span className="mb-1.5 inline-flex items-center gap-1 bg-[#2E1C14] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F3E3C8]">
                  <Crown size={11} aria-hidden="true" /> Premium Shop
                </span>
                <Link href={gate(`/store/${store.slug}`)} className="group/title block">
                  <h3 className="text-lg sm:text-xl font-bold text-ink group-hover/title:text-taupe transition-colors truncate">
                    {store.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs font-bold text-ink">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {store.reviews_count ? `(${store.reviews_count} Reviews)` : '(Verified Tailor)'}
                  </span>
                </div>
                {shopAddress(store) && (
                  <p className="mt-1.5 flex items-start gap-1 text-xs text-ink-muted" title={shopAddress(store)}>
                    <MapPin size={12} className="mt-0.5 text-taupe shrink-0" aria-hidden="true" />
                    <span className="line-clamp-2">{shopAddress(store)}</span>
                  </p>
                )}
              </div>

              {/* 2x2 Thumbnail Grid (Steam screenshots style) */}
              <div className="my-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Services
                </p>
                {thumbnails.length === 0 && (
                  <div className="flex aspect-[16/7] flex-col items-center justify-center gap-1 border border-dashed border-line bg-sunken/50 px-4 text-center">
                    <Scissors size={18} className="text-taupe/60" aria-hidden="true" />
                    <p className="text-xs font-medium text-ink-body">No services listed yet</p>
                    <p className="text-[11px] text-ink-muted">Visit the shop to ask what they can make for you.</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {thumbnails.map((thumb) => {
                    const isHovered = hoveredPreview?.id === thumb.id;
                    return (
                      <Link
                        key={thumb.id}
                        href={gate(`/store/${store.slug}/service/${thumb.id}`)}
                        onMouseEnter={() => setHoveredPreview(thumb.imageUrl ? thumb : null)}
                        onMouseLeave={() => setHoveredPreview(null)}
                        className={`relative aspect-[16/10] bg-sunken border overflow-hidden transition-all duration-200 group/thumb ${
                          isHovered
                            ? 'border-taupe ring-2 ring-taupe/40 shadow-sm scale-102'
                            : 'border-line hover:border-line-strong'
                        }`}
                      >
                        {thumb.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getMediaUrl(thumb.imageUrl)}
                            alt={thumb.name}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/shop_storefront.jpg';
                            }}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-[#EFE6DA]" aria-hidden="true">
                            <Scissors size={20} className="text-taupe/60" />
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-1 px-1.5 opacity-90 group-hover/thumb:opacity-100">
                          <p className="text-[10px] font-semibold text-white truncate leading-tight">
                            {thumb.name}
                          </p>
                          {thumb.price != null && Number(thumb.price) > 0 && (
                            <p className="text-[10px] text-white/80 tabular-nums leading-tight">
                              from ₱{Number(thumb.price).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Action Button */}
              <div className="pt-3 border-t border-line flex items-center shrink-0">
                <Link
                  href={gate(`/store/${store.slug}`)}
                  className="w-full min-h-[44px] px-5 bg-ink text-white hover:bg-taupe text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>Visit Shop</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Arrow Button */}
        {canCycle && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next featured shop"
            className="hidden sm:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-surface border border-line shadow-md text-ink hover:text-taupe hover:border-line-hover transition-all z-20 cursor-pointer active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Steam-Style Sleek Dash Pagination Indicators */}
      {canCycle && (
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-3 sm:mt-4">
          {stores.map((s, i) => {
            const isActive = i === index;
            return (
              <button
                key={s.id ?? i}
                type="button"
                onClick={() => {
                  setHoveredPreview(null);
                  setIndex(i);
                }}
                aria-label={`Jump to ${s.name}`}
                className="h-6 px-1 flex items-center justify-center cursor-pointer group"
              >
                <span
                  className={`block h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-7 sm:w-8 bg-taupe'
                      : 'w-2.5 sm:w-3 bg-line group-hover:bg-taupe/60'
                  }`}
                />
                <span className="sr-only">{s.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
