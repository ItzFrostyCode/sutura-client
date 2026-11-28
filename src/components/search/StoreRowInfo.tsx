import { Star } from 'lucide-react';
import PremiumBadge from '@/components/shared/PremiumBadge';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { isStoreOpen, type OperatingHours } from '@/lib/storeStatus';
import ShopHoursStatus from '@/components/shared/ShopHoursStatus';

interface StoreRowInfoProps {
  readonly store: {
    name: string;
    operating_hours?: OperatingHours | string | null;
    reviews_avg_rating?: number | string | null;
    reviews_count?: number | null;
    subscription_plan?: string | null;
    is_featured?: boolean | null;
  };
  readonly index: number;
  readonly distKm: number | null;
  readonly addressText: string;
  readonly imageSrc?: string | null;
  /** After a search: why this shop is in the results ("Offers: Barong Tagalog Tailoring", "Address mentions …"). */
  readonly matchNote?: string | null;
}

/**
 * One shop in the map's list: logo, distance (+ "Nearest"), Premium, the name (two lines, never cut to "Thre…"), the
 * real rating if any, the HOURS in words the way Google Maps says them — "Open · Closes 6:00 PM", "Closes soon · 5:00 PM",
 * "Closed · Opens 9:00 AM" / "Opens tomorrow 9:00 AM" — so the customer knows if they can go now, and the address.
 * The owner's personal name is not shown: customers choose a shop.
 */
export default function StoreRowInfo({ store, index, distKm, addressText, imageSrc, matchNote }: StoreRowInfoProps) {
  const open = store.operating_hours ? isStoreOpen(store.operating_hours) : null;
  const premium = store.subscription_plan === 'premium' || Boolean(store.is_featured);
  const rating = store.reviews_avg_rating ? Number(store.reviews_avg_rating) : null;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3.5">
      <StoreLogoAvatar src={imageSrc} name={store.name} isOpen={open ?? undefined} className="h-14 w-14 rounded-full border border-line bg-sunken" textClassName="text-base font-bold text-taupe" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          {distKm != null && (
            <span className="font-semibold uppercase tracking-wide text-taupe-dark">{index === 0 ? `Nearest · ${distKm.toFixed(1)} km` : `${distKm.toFixed(1)} km`}</span>
          )}
          {premium && <PremiumBadge />}
        </div>
        <h3 className="mobile-h4 line-clamp-2 text-ink transition-colors group-hover:text-taupe-dark">{store.name}</h3>
        {matchNote && <p className="line-clamp-2 text-xs font-semibold text-taupe-dark">{matchNote}</p>}
        {rating !== null ? (
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
            <Star size={12} className="fill-amber-500 text-amber-500" aria-hidden /> ({store.reviews_count ?? 0})
          </p>
        ) : (
          <p className="text-xs text-ink-muted">No reviews yet</p>
        )}
        <ShopHoursStatus hours={store.operating_hours} />
        <p className="line-clamp-2 text-xs text-ink-muted">{addressText}</p>
      </div>
    </div>
  );
}
