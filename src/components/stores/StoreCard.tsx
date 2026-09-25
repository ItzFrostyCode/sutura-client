import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isStoreOpen } from '@/lib/storeStatus';
import { type StoreResult } from './storesTypes';

export default function StoreCard({ store }: Readonly<{ store: StoreResult }>) {
  const gate = useGuestGatedHref();
  const isOpen = isStoreOpen(store.operating_hours);

  return (
    <Link
      href={gate(`/store/${store.slug}`)}
      className="bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors flex flex-col"
    >
      <div className="h-28 bg-sunken relative shrink-0">
        {store.banner_path ? (
          <Image
            src={getMediaUrl(store.banner_path)}
            alt={store.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={24} className="text-ink-faint" />
          </div>
        )}
        <div className="absolute -bottom-5 left-3 w-12 h-12 shrink-0">
          <div className="w-full h-full rounded-full border-2 border-surface bg-surface overflow-hidden relative">
            {store.logo_path ? (
              <Image
                src={getMediaUrl(store.logo_path)}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sunken">
                <Store size={14} className="text-ink-faint" />
              </div>
            )}
          </div>
          {/* Online / Offline status dot */}
          <span
            aria-label={isOpen ? 'Open now' : 'Closed now'}
            title={isOpen ? 'Open now' : 'Closed now'}
            className={`absolute bottom-0 right-0 z-10 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
              isOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
            }`}
          />
        </div>
      </div>

      <div className="p-3 pt-7 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="mobile-h4 font-medium text-ink truncate leading-tight">{store.name}</h3>
          {store.branches[0] && (
            <p className="mobile-caption text-ink-muted flex items-center gap-1 mt-1 truncate font-normal">
              <MapPin size={12} className="shrink-0 text-ink-faint" />
              {store.branches[0].city ?? store.branches[0].name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 mt-2">
          <Star size={12} className="text-taupe fill-taupe" />
          <span className="mobile-caption font-semibold text-ink">
            {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}
          </span>
          <span className="mobile-caption text-ink-faint font-normal">({store.reviews_count})</span>
        </div>
      </div>
    </Link>
  );
}
