import Link from 'next/link';
import { Store, MapPin, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isStoreOpen } from '@/lib/storeStatus';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import HomeCarouselRow from './HomeCarouselRow';
import type { StoreResult } from './homeTypes';

interface HomeStoresGridProps {
  stores: StoreResult[];
  storesLoading: boolean;
}

export default function HomeStoresGrid({
  stores,
  storesLoading,
}: HomeStoresGridProps) {
  const gate = useGuestGatedHref();

  return (
    <section aria-labelledby="home-stores-title" className="max-w-7xl mx-auto mobile-screen-margins mt-8">
      {storesLoading && (
        <>
          <h2 id="home-stores-title" className="mobile-h2 sm:tablet-h2 text-ink mb-4">
            Stores
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,284px))] gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`bg-surface border border-line overflow-hidden animate-pulse ${i >= 4 ? 'hidden sm:block' : ''}`}
              >
                <div className="h-28 bg-sunken" />
                <div className="p-3.5 pt-8 space-y-2">
                  <div className="h-4 w-3/4 bg-sunken rounded" />
                  <div className="h-3.5 w-1/2 bg-sunken rounded" />
                  <div className="h-3.5 w-1/3 bg-sunken rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!storesLoading && stores.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 id="home-stores-title" className="mobile-h2 sm:tablet-h2 text-ink">
              Stores
            </h2>
            <Link href="/stores" className="text-sm font-semibold text-taupe hover:text-taupe-hover min-h-[44px] flex items-center">
              See all →
            </Link>
          </div>
          <HomeCarouselRow>
            {stores.slice(0, 10).map((store) => (
              <Link
                key={store.id}
                href={gate(`/store/${store.slug}`)}
                className="w-[236px] shrink-0 snap-start bg-surface border border-line overflow-hidden hover:border-line-strong transition-all active:scale-[0.98] group flex flex-col justify-between"
              >
                <div className="h-28 bg-sunken relative">
                  {store.banner_path ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getMediaUrl(store.banner_path)}
                      alt={store.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/hero_banner.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store size={24} className="text-ink-faint" />
                    </div>
                  )}
                  <div className="absolute -bottom-5 left-3">
                    <StoreLogoAvatar
                      src={store.logo_path}
                      name={store.name}
                      className="w-14 h-14 rounded-full border-2 border-surface bg-surface shadow-xs"
                      textClassName="text-base font-bold text-taupe"
                      isOpen={isStoreOpen(store.operating_hours)}
                    />
                  </div>
                </div>
                <div className="p-3.5 pt-7">
                  <h3 className="mobile-h4 text-ink truncate group-hover:text-taupe transition-colors">
                    {store.name}
                  </h3>
                  {store.branches[0] && (
                    <p className="mobile-caption text-ink-muted flex items-center gap-1 mt-1 truncate font-normal">
                      <MapPin size={12} className="shrink-0 text-taupe" />
                      {store.branches[0].city ?? store.branches[0].name}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Star size={13} className="text-taupe fill-taupe" />
                    <span className="text-xs font-semibold text-ink">
                      {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}
                    </span>
                    <span className="text-xs text-ink-faint font-normal">({store.reviews_count})</span>
                  </div>
                </div>
              </Link>
            ))}
          </HomeCarouselRow>
        </>
      )}
    </section>
  );
}
