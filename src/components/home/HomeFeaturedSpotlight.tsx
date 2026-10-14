'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import type { CatalogItemResult } from '@/types/publicCatalog';
import FeaturedDetails from './FeaturedDetails';
import HomeSectionHeader from './HomeSectionHeader';
import { getStoreThumbnails, type ThumbnailItem } from './featuredThumbnails';
import type { StoreResult } from './homeTypes';

interface HomeFeaturedSpotlightProps {
  readonly stores: StoreResult[];
  readonly trendingItems: CatalogItemResult[];
}

const arrow = 'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_10px_rgba(45,42,38,0.15)] transition-opacity hover:opacity-90 active:opacity-70';

/** One featured shop at a time: a large photo, its details, and arrows / dashes to move between shops. */
export default function HomeFeaturedSpotlight({ stores, trendingItems }: HomeFeaturedSpotlightProps) {
  const gate = useGuestGatedHref();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState<ThumbnailItem | null>(null);
  const [paused, setPaused] = useState(false);

  const store = stores[index] ?? null;
  const thumbnails = useMemo(() => getStoreThumbnails(store, trendingItems), [store, trendingItems]);
  const canCycle = stores.length > 1;
  const move = (delta: number) => {
    setHovered(null);
    setIndex((i) => (i + delta + stores.length) % stores.length);
  };

  // Changes shop every 7 seconds, and waits while the pointer is over it.
  useEffect(() => {
    if (paused || stores.length <= 1) return;
    const timer = setInterval(() => move(1), 7000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- move only depends on stores.length
  }, [paused, stores.length]);

  if (!store) return null;
  const photo = hovered?.imageUrl ?? store.banner_path ?? '/images/hero_banner.jpg';

  return (
    <section aria-labelledby="featured-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); setHovered(null); }}>
      <HomeSectionHeader id="featured-title" title="Featured" href="/stores" linkLabel="Explore all tailors" />

      <div className="card-soft overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="relative h-[220px] w-full bg-sunken sm:h-[300px] lg:h-auto lg:min-h-[400px] lg:flex-1">
            <Link href={gate(`/store/${store.slug}`)} aria-label={`Visit ${store.name}`} className="absolute inset-0 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={photo}
                src={getMediaUrl(photo)}
                alt={store.name}
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/hero_banner.jpg'; }}
              />
            </Link>
            {hovered && (
              <p className="absolute left-3 top-3 max-w-[80%] truncate rounded-full bg-surface px-3 py-1.5 text-xs text-ink shadow-[0_2px_10px_rgba(45,42,38,0.15)]">
                {hovered.name}{hovered.price ? ` · ₱${Number(hovered.price).toLocaleString()}` : ''}
              </p>
            )}
            {canCycle && (
              <>
                <button type="button" onClick={() => move(-1)} aria-label="Previous featured shop" className={`${arrow} left-3`}><ChevronLeft size={20} /></button>
                <button type="button" onClick={() => move(1)} aria-label="Next featured shop" className={`${arrow} right-3`}><ChevronRight size={20} /></button>
              </>
            )}
          </div>
          <FeaturedDetails store={store} thumbnails={thumbnails} hoveredId={hovered?.id} onHover={setHovered} gate={gate} />
        </div>
      </div>

      {canCycle && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {stores.map((s, i) => (
            <button key={s.id} type="button" onClick={() => { setHovered(null); setIndex(i); }} aria-label={`Show ${s.name}`} aria-current={i === index} className="flex h-6 items-center px-0.5">
              <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-taupe' : 'w-1.5 bg-line-strong'}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
