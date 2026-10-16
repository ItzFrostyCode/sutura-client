import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isStoreOpen } from '@/lib/storeStatus';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { type StoreResult } from './storesTypes';

export default function StoreCard({ store }: Readonly<{ store: StoreResult }>) {
  const gate = useGuestGatedHref();
  const isOpen = isStoreOpen(store.operating_hours);

  return (
    <Link
      href={gate(`/store/${store.slug}`)}
      className="bg-surface border border-line rounded-xl sm:rounded-2xl overflow-hidden hover:border-line-strong hover:shadow-sm transition-all flex flex-col group"
    >
      <div className="h-28 sm:h-32 bg-sunken relative shrink-0 overflow-hidden">
        {store.banner_path ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getMediaUrl(store.banner_path)}
            alt={store.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            className="w-12 h-12 rounded-full border-2 border-surface bg-surface shadow-xs transition-transform group-hover:scale-105"
            textClassName="text-sm font-bold text-taupe"
            isOpen={isOpen}
          />
        </div>
      </div>

      <div className="p-3.5 pt-7 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="mobile-h4 font-medium text-ink group-hover:text-taupe transition-colors truncate leading-tight">
            {store.name}
          </h3>
          {store.branches[0] && (
            <p className="mobile-caption text-ink-muted flex items-center gap-1 mt-1 truncate font-normal">
              <MapPin size={12} className="shrink-0 text-taupe" />
              {store.branches[0].district ?? store.branches[0].city ?? store.branches[0].name}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-line/40">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-taupe fill-taupe" />
            <span className="mobile-caption font-semibold text-ink">
              {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}
            </span>
            <span className="mobile-caption text-ink-faint font-normal">({store.reviews_count})</span>
          </div>
          <span className="text-xs font-semibold text-taupe group-hover:translate-x-0.5 transition-transform">
            Visit &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
