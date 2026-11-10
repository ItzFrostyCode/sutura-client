import Link from 'next/link';
import { BadgeCheck, MapPin, Star, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getStoreStatus } from '@/lib/storeStatus';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import PremiumBadge from '@/components/shared/PremiumBadge';
import type { StoreResult } from './homeTypes';

/**
 * One shop in "Shops near you". Every card has the same layout, photo or not:
 *   [cover photo, or a plain placeholder]            [Open now / Closed]
 *   [logo]  Shop name (2 lines kept, so cards line up)
 *           ✓ Verified shop
 *   ─────────────────────────────────────────────
 *   📍 District · km                         ★ rating
 * The logo is ALWAYS on the left of the name; a shop without a cover never gets its logo blown up into the photo
 * area (that made those cards look different from the rest). Every shop listed by /public/stores is admin-approved,
 * hence "Verified shop" — the thesis's admin verification, made visible.
 */
export default function HomeShopCard({ store }: { readonly store: StoreResult }) {
  const branch = store.branches[0];
  const place = branch?.district ?? branch?.city ?? branch?.name;
  const km = store.distance_km == null ? null : Number(store.distance_km);
  const status = store.operating_hours ? getStoreStatus(store.operating_hours) : null;

  return (
    <Link href={`/store/${store.slug}`} className="card-soft group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-28 shrink-0 overflow-hidden bg-sunken">
        {/* The placeholder sits under the photo, so a photo that fails to load falls back to it too. */}
        <div className="absolute inset-0 flex items-center justify-center text-ink-faint" aria-hidden>
          <Store size={28} strokeWidth={1.5} />
        </div>
        {store.banner_path && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getMediaUrl(store.banner_path)}
            alt=""
            className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
          />
        )}
        {store.is_featured && <PremiumBadge className="absolute left-2 top-2" />}
        {status && (
          <span className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border bg-white/95 px-2 py-0.5 text-xs font-semibold ${status.isOpen ? 'border-emerald-200 text-emerald-800' : 'border-line text-ink-muted'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} aria-hidden />
            {status.isOpen ? 'Open now' : 'Closed'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex items-start gap-3">
          <StoreLogoAvatar src={store.logo_path} name={store.name} className="h-11 w-11 shrink-0 rounded-full border border-line bg-surface" textClassName="text-base font-semibold text-taupe-dark" />
          <div className="min-w-0 flex-1">
            {/* Room for two lines on every card, so the rows below line up across the row of cards. */}
            <h3 className="mobile-h4 line-clamp-2 min-h-[2.8em] text-ink group-hover:text-taupe-dark">{store.name}</h3>
            <p className="mobile-caption mt-0.5 flex items-center gap-1 font-semibold text-emerald-800">
              <BadgeCheck size={14} aria-hidden /> Verified shop
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/60 pt-2.5 text-xs">
          {place ? (
            <span className="flex min-w-0 items-center gap-1 text-ink-muted">
              <MapPin size={13} className="shrink-0 text-taupe-dark" aria-hidden />
              <span className="truncate">{place}{km !== null && Number.isFinite(km) ? ` · ${km.toFixed(1)} km` : ''}</span>
            </span>
          ) : <span />}
          <span className="flex shrink-0 items-center gap-1 text-ink">
            <Star size={13} className="fill-[#B45309] text-[#B45309]" aria-hidden />
            <span className="font-semibold">{store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}</span>
            {store.reviews_count > 0 && <span className="text-ink-muted">({store.reviews_count})</span>}
          </span>
        </div>
      </div>
    </Link>
  );
}
