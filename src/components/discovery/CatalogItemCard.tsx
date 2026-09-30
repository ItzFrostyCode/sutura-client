import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Star, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { getItemDistanceInfo } from '@/lib/customerLocation';
import { formatEstimatedTurnaround } from '@/lib/turnaroundHelper';
import type { CatalogItemResult } from '@/types/publicCatalog';

/**
 * The single catalog-item card style every customer-facing browse surface
 * (landing page's Catalog Showroom, /search's results grid, store profile catalog) uses.
 * Sequential structure per user specification:
 * 1. Image Thumbnail
 * 2. Name
 * 3. Price
 * 4. Star (Average Rating) | (count) sold
 * 5. Clock {estimated exact count days day-day/monthday - day}
 * 6. Location
 */
export default function CatalogItemCard({
  item,
  userCoords,
  canManage,
  onDelete,
  hideLocation,
  hrefOverride,
  isPaused,
}: {
  readonly item: CatalogItemResult;
  readonly userCoords?: { lat: number; lng: number } | null;
  /** Owner viewing their own store's catalog — shows an edit/delete overlay. */
  readonly canManage?: boolean;
  readonly onDelete?: (id: number) => void;
  /** Dashboard grids: every item is this store's own, so location is a given. */
  readonly hideLocation?: boolean;
  /** Dashboard grids link to the item's own management page, not its public storefront page. */
  readonly hrefOverride?: string;
  /** Owner-only: this item is currently paused (is_active === false). */
  readonly isPaused?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const primaryImage = item.images.find((img) => img.is_primary)?.image_url ?? item.images[0]?.image_url;
  const displayImage = imgError ? primaryImage : primaryImage;
  const gate = useGuestGatedHref();
  const distInfo = getItemDistanceInfo(item, userCoords);

  useEffect(() => {
    setImgError(false);
  }, [item.id]);

  const turnaroundText = formatEstimatedTurnaround(item.estimated_days);
  const branch = item.store?.branches?.[0];
  const locationText = branch?.district
    ? `${branch.district}, Davao City`
    : (branch?.city || item.store?.name || 'Davao City');

  return (
    <div className="group relative w-full h-full">
      {canManage && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
          <Link
            href={`/dashboard/catalog/${item.id}`}
            aria-label="Edit catalog item"
            className="w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white text-ink border border-line shadow-xs transition-colors"
          >
            <Pencil size={12} />
          </Link>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(item.id); }}
            aria-label="Delete catalog item"
            className="w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-rose-50 text-danger border border-line shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
      <Link
        href={hrefOverride ?? gate(item.store ? `/store/${item.store.slug}/catalog/${item.id}` : '/search')}
        className="flex flex-col justify-between w-full h-full bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors"
      >
      {/* 1. Image Thumbnail */}
      <div className="aspect-3/4 bg-sunken relative overflow-hidden shrink-0">
        {isPaused && (
          <div className="absolute top-1.5 left-1.5 z-10 px-2 py-0.5 bg-ink/85 text-white text-[9px] font-bold uppercase tracking-wider">
            Paused
          </div>
        )}
        {displayImage ? (
          <Image
            key={displayImage}
            src={getMediaUrl(displayImage)}
            alt={item.name}
            fill
            onError={() => setImgError(true)}
            className={`object-cover object-top transition-transform duration-700 group-hover:scale-105 ${isPaused ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={22} className="text-ink-faint" />
          </div>
        )}

        {/* Hover overlay with material badge */}
        <div className="absolute inset-0 bg-surface/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-2 text-center">
          <span className="text-[10px] font-medium tracking-widest uppercase text-ink border border-ink px-3 py-1.5">
            {item.material || 'View Details'}
          </span>
        </div>
      </div>

      {/* Card Info Body - Sequential order per user spec */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between gap-1.5">
        <div className="space-y-1">
          {/* 2. Name */}
          <h3 className="text-[13px] font-semibold text-ink line-clamp-2 leading-snug group-hover:text-taupe transition-colors min-h-[36px]">
            {item.name}
          </h3>

          {/* 3. Price */}
          <p className="text-sm font-bold text-ink">
            {item.price !== null && item.price !== undefined
              ? `₱${Number(item.price).toLocaleString()}`
              : 'Custom Quote'}
          </p>

          {/* 4. Star (Average Rating) | (count) sold */}
          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <div className="flex items-center gap-1 shrink-0">
              <Star size={11} className="fill-amber-400 text-amber-500 shrink-0" />
              <span className="font-semibold text-ink">
                {item.reviews_avg_rating && Number(item.reviews_avg_rating) > 0
                  ? Number(item.reviews_avg_rating).toFixed(1)
                  : '0.0'}
              </span>
            </div>
            <span className="text-ink-faint">|</span>
            <span className="truncate">{item.order_count ?? 0} sold</span>
          </div>

          {/* 5. Clock {estimated exact count days day-day/monthday - day} */}
          <div
            className="flex items-center gap-1 text-[11px] text-ink-muted truncate"
            title={turnaroundText}
          >
            <Clock size={11} className="text-taupe shrink-0" />
            <span className="truncate">{turnaroundText}</span>
          </div>
        </div>

        {/* 6. Location on left, KM on right — skipped in the shop owner's
            own dashboard grid, where every item is obviously this store's
            own and repeating its location on every card is just noise. */}
        {!hideLocation && (
          <div className="flex items-center justify-between gap-1 text-[11px] text-ink-faint pt-1 border-t border-line/50">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <MapPin size={11} className="text-taupe/70 shrink-0" />
              <span className="truncate">{locationText}</span>
            </div>
            {distInfo ? (
              <span className="shrink-0 text-ink-muted font-medium text-[10px] pl-1">
                {distInfo.distanceKm.toFixed(1)} km
              </span>
            ) : null}
          </div>
        )}
      </div>
      </Link>
    </div>
  );
}

