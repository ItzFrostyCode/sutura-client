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
      className="card-soft group w-[260px] shrink-0 snap-start overflow-hidden transition-all hover:shadow-md active:scale-[0.98] flex flex-col"
    >
      <div className="relative h-28 bg-sunken overflow-hidden">
        {store.banner_path ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getMediaUrl(store.banner_path)}
            alt=""
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#FAF7F4] to-[#ECE7E1]">
            <Store size={24} className="text-taupe/40" />
          </div>
        )}
        {status && (
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md shadow-2xs border ${
              status.isOpen ? 'bg-white/90 text-emerald-700 border-emerald-200' : 'bg-white/90 text-ink-muted border-line'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
              {status.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start gap-2.5">
            <StoreLogoAvatar
              src={store.logo_path}
              name={store.name}
              className="h-10 w-10 rounded-full border border-line bg-surface shadow-2xs shrink-0 transition-transform group-hover:scale-105"
              textClassName="text-sm font-bold text-taupe"
            />
            <div className="min-w-0 flex-1">
              <h3 className="mobile-h4 truncate text-ink font-bold transition-colors group-hover:text-taupe leading-tight">
                {store.name}
              </h3>
              {place && (
                <p className="mobile-caption mt-0.5 flex items-center gap-1 truncate text-ink-muted">
                  <MapPin size={11} className="shrink-0 text-taupe" />
                  <span className="truncate">{place}{km !== null && Number.isFinite(km) ? ` · ${km.toFixed(1)} km` : ''}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs text-ink">
            <Star size={12} className="fill-[#D97706] text-[#D97706]" />
            <span className="font-bold">{store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}</span>
            <span className="text-ink-faint">({store.reviews_count})</span>
          </span>
          <span className="text-xs font-semibold text-taupe group-hover:translate-x-0.5 transition-transform">
            Visit &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

