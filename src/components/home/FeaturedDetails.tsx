import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { StoreResult } from './homeTypes';
import type { ThumbnailItem } from './featuredThumbnails';

interface FeaturedDetailsProps {
  readonly store: StoreResult;
  readonly thumbnails: ThumbnailItem[];
  readonly hoveredId?: number;
  readonly onHover: (thumb: ThumbnailItem | null) => void;
  readonly gate: (href: string) => string;
}

/** Right side of the featured card: name, rating, place, four signature works and the way to the shop. */
export default function FeaturedDetails({ store, thumbnails, hoveredId, onHover, gate }: FeaturedDetailsProps) {
  const branch = store.branches?.[0];

  return (
    <div className="flex w-full shrink-0 flex-col justify-between p-5 sm:p-6 lg:w-[360px]">
      <div>
        <Link href={gate(`/store/${store.slug}`)} className="group block">
          <h3 className="truncate text-xl font-semibold tracking-tight text-ink transition-colors group-hover:text-taupe">{store.name}</h3>
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span className="flex items-center gap-1 text-ink">
            <Star size={14} className="fill-taupe text-taupe" />
            {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}
          </span>
          <span>{store.reviews_count ? `${store.reviews_count} reviews` : 'Verified tailor'}</span>
          {branch && (
            <span className="flex items-center gap-1">
              <MapPin size={13} className="shrink-0 text-taupe" />
              {branch.district ?? branch.city ?? branch.name}
            </span>
          )}
        </div>
      </div>

      <div className="my-5">
        <p className="mobile-overline mb-2.5 text-ink-faint">Signature works</p>
        <div className="grid grid-cols-2 gap-3">
          {thumbnails.map((thumb) => (
            <Link
              key={thumb.id}
              href={gate(`/store/${store.slug}/catalog/${thumb.id}`)}
              onMouseEnter={() => onHover(thumb)}
              onMouseLeave={() => onHover(null)}
              className="group/thumb block"
            >
              <div className={`relative aspect-[16/10] overflow-hidden rounded-xl bg-sunken ring-2 transition-shadow ${hoveredId === thumb.id ? 'ring-taupe/50' : 'ring-transparent'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMediaUrl(thumb.imageUrl)}
                  alt={thumb.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/shop_storefront.jpg'; }}
                />
              </div>
              <p className="mt-1.5 truncate text-xs text-ink-body">{thumb.name}</p>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href={gate(`/store/${store.slug}`)}
        className="flex h-12 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-taupe active:opacity-80"
      >
        Visit store
      </Link>
    </div>
  );
}
