'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Store as StoreIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import type { StoreResult } from './homeTypes';
import type { CatalogItemResult } from '@/types/publicCatalog';

interface HomeFeaturedSpotlightProps {
  readonly stores: StoreResult[];
  readonly trendingItems: CatalogItemResult[];
  readonly loading?: boolean;
}

// "Featured & Recommended" — big spotlight (left) + a rail of real
// bestsellers (right), same big-card-plus-sidebar shape as Steam's own
// featured module. The spotlight rotates through several real stores via
// prev/next arrows instead of singling one out with a "Featured Store"
// label — SUTURA has no paid featured-placement perk, so calling out one
// specific store that way would read as favoritism nothing backs. The
// rail is the real top_sales sort /search already offers, not a
// fabricated ranking.
export default function HomeFeaturedSpotlight({ stores, trendingItems, loading = false }: HomeFeaturedSpotlightProps) {
  const gate = useGuestGatedHref();
  const [index, setIndex] = useState(0);
  const store = stores[index] ?? null;

  if (loading) {
    return (
      <section aria-labelledby="featured-spotlight-title" className="max-w-7xl mx-auto mobile-screen-margins mt-8 sm:mt-10">
        <p className="mobile-overline sm:tablet-overline text-taupe mb-3" id="featured-spotlight-title">
          Featured &amp; Recommended
        </p>
        <div className="flex flex-col lg:flex-row gap-3 animate-pulse">
          <div className="relative flex-1 h-[280px] sm:h-[340px] bg-sunken border border-line overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 space-y-2">
              <div className="h-6 sm:h-7 w-2/3 sm:w-1/2 bg-line rounded" />
              <div className="h-4 w-1/3 bg-line rounded" />
            </div>
          </div>
          <div className="w-full lg:w-[300px] shrink-0 bg-surface border border-line p-3 flex flex-col">
            <div className="h-3 w-24 bg-sunken rounded mb-3 mx-1" />
            <div className="flex flex-col divide-y divide-line">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                  <div className="w-11 h-11 shrink-0 bg-sunken border border-line" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 w-4/5 bg-sunken rounded" />
                    <div className="h-2.5 w-1/2 bg-sunken rounded" />
                  </div>
                  <div className="h-3 w-10 bg-sunken rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!store && trendingItems.length === 0) return null;

  const canCycle = stores.length > 1;
  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setIndex((i) => (i - 1 + stores.length) % stores.length);
  };
  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setIndex((i) => (i + 1) % stores.length);
  };

  return (
    <section aria-labelledby="featured-spotlight-title" className="max-w-7xl mx-auto mobile-screen-margins mt-8 sm:mt-10">
      <p className="mobile-overline sm:tablet-overline text-taupe mb-3" id="featured-spotlight-title">
        Featured &amp; Recommended
      </p>

      <div className="flex flex-col lg:flex-row gap-3">
        {store && (
          <div className="relative flex-1 h-[280px] sm:h-[340px] bg-sunken border border-line overflow-hidden group">
            <Link href={gate(`/store/${store.slug}`)} className="absolute inset-0">
              {store.banner_path ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getMediaUrl(store.banner_path)}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/hero_banner.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <StoreIcon size={40} className="text-ink-faint" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <h3 className="mobile-h2 sm:tablet-h2 text-white mb-1.5">{store.name}</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-white/90">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}
                    <span className="text-white/60">({store.reviews_count})</span>
                  </span>
                  {store.branches?.[0] && (
                    <span className="flex items-center gap-1 text-sm text-white/90">
                      <MapPin size={14} className="text-white/70" />
                      {store.branches[0].city ?? store.branches[0].name}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {canCycle && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous store"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white transition-colors z-10 cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next store"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white transition-colors z-10 cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        )}

        {trendingItems.length > 0 && (
          <div className="w-full lg:w-[300px] shrink-0 bg-surface border border-line p-3 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wider text-ink mb-2.5 px-1">Trending Now</p>
            <div className="flex flex-col divide-y divide-line">
              {trendingItems.slice(0, 4).map((item) => {
                const primaryImage = item.images?.find((img) => img.is_primary)?.image_url ?? item.images?.[0]?.image_url;
                const itemHref = item.store ? `/store/${item.store.slug}/catalog/${item.id}` : '/search';
                return (
                  <Link
                    key={item.id}
                    href={gate(itemHref)}
                    className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0 hover:bg-canvas transition-colors -mx-1 px-1"
                  >
                    <div className="relative w-11 h-11 shrink-0 bg-sunken border border-line overflow-hidden">
                      {primaryImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getMediaUrl(primaryImage)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/shop_storefront.jpg';
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink truncate">{item.name}</p>
                      {item.store && (
                        <p className="text-[11px] text-ink-muted truncate">{item.store.name}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-ink shrink-0">
                      {item.price !== null ? `₱${Number(item.price).toLocaleString()}` : 'Quote'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
