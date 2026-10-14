import Link from 'next/link';
import { MapPin, Star, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getStoreStatus } from '@/lib/storeStatus';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import type { StoreResult } from './homeTypes';

/** One shop in a Discover row. Distance and open/closed show only when the data really has them. */
export default function HomeShopCard({ store }: { readonly store: StoreResult }) {
  const branch = store.branches[0];
  const place = branch?.district ?? branch?.city ?? branch?.name;
  const km = store.distance_km == null ? null : Number(store.distance_km);
  const status = store.operating_hours ? getStoreStatus(store.operating_hours) : null;

  return (
    <Link
      href={`/store/${store.slug}`}
      className="card-soft group w-[250px] shrink-0 snap-start overflow-hidden transition-transform active:scale-[0.98]"
    >
      <div className="relative h-28 bg-sunken">
        {store.banner_path ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getMediaUrl(store.banner_path)}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/hero_banner.jpg'; }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><Store size={24} className="text-ink-faint" /></div>
        )}
        <div className="absolute -bottom-5 left-3">
          <StoreLogoAvatar
            src={store.logo_path}
            name={store.name}
            className="h-12 w-12 rounded-full ring-2 ring-surface"
            textClassName="text-base font-bold text-taupe"
          />
        </div>
      </div>
      <div className="p-3.5 pt-7">
        <h3 className="mobile-h4 truncate text-ink transition-colors group-hover:text-taupe">{store.name}</h3>
        {place && (
          <p className="mobile-caption mt-1 flex items-center gap-1 truncate text-ink-muted">
            <MapPin size={12} className="shrink-0 text-taupe" />
            <span className="truncate">{place}{km !== null && Number.isFinite(km) ? ` · ${km.toFixed(1)} km` : ''}</span>
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs text-ink">
            <Star size={13} className="fill-taupe text-taupe" />
            <span className="font-semibold">{store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}</span>
            <span className="text-ink-faint">({store.reviews_count})</span>
          </span>
          {status && (
            <span className="mobile-caption flex items-center gap-1 text-ink-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
              {status.isOpen ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
