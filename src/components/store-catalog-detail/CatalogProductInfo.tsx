import React from 'react';
import Link from 'next/link';
import { Star, Scissors } from 'lucide-react';
import { CatalogItem } from './types';
import { formatTurnaround } from '@/lib/formatTurnaround';
import { designPriceDetail } from '@/lib/designPricing';

interface CatalogProductInfoProps {
  item: CatalogItem;
  isSaved?: boolean;
  /** Owner view: ratings and sold counts are customer activity, not part of the design itself. */
  hideStats?: boolean;
  computedPrice?: { total: number; base: number; sizeExtra: number; addOnsTotal: number } | null;
}

export default function CatalogProductInfo({ item, hideStats, computedPrice }: CatalogProductInfoProps) {
  const avgRating = item.reviews_avg_rating ?? 0;
  const reviewsCount = item.reviews_count ?? 0;
  // A design is priced by its service; the shop may add an extra charge or ask for a quote (lib/designPricing).
  const price = item.pricing ? designPriceDetail(item.pricing, item.service?.name) : null;
  const minOrder = item.service?.min_order_qty && Number(item.service.min_order_qty) > 1 ? Number(item.service.min_order_qty) : null;

  return (
    <div className="space-y-0">
      {/* Parent Service Link */}
      {item.service && (
        <div className="pb-2">
          <Link
            href={item.store?.slug ? `/store/${item.store.slug}/service/${item.service.id}` : `/dashboard/services/${item.service.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-taupe hover:underline"
          >
            <Scissors size={12} className="shrink-0" />
            <span className="truncate">Service: {item.service.name}</span>
          </Link>
        </div>
      )}

      {/* 1. Product Name */}
      <h1 className="text-xl font-semibold text-ink leading-snug pb-3">
        {item.name}
      </h1>

      {/* 2. Stats Row — avg rating | stars | count Ratings | · | count Sold */}
      {!hideStats && <div className="flex items-center gap-2.5 pb-3 border-b border-line flex-wrap text-sm">
        <span className="font-bold text-taupe underline underline-offset-2">
          {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
        </span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={14}
              className={n <= Math.round(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-line-strong'}
            />
          ))}
        </div>
        <div className="w-px h-4 bg-line" />
        <span className="text-ink-muted">{reviewsCount} Ratings</span>
        <div className="w-px h-4 bg-line" />
        <span className="text-ink-muted">{item.order_count ?? 0} Sold</span>
      </div>}

      {/* 3. Price Banner Box — light bg, stands alone */}
      <div className="bg-[#fafafa] border border-line px-4 py-4 my-0">
        {price ? (
          <>
            <p className="text-3xl font-bold text-taupe leading-none">
              {price.main}
              {price.struck && <span className="ml-2 align-middle text-base font-normal text-ink-faint line-through">{price.struck}</span>}
            </p>
            <p className="mobile-caption mt-2 text-ink-muted">
              Base price for this design. The shop confirms the final price.
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-taupe leading-none">₱{Number(item.price).toLocaleString()}</p>
            <p className="mobile-caption mt-2 text-ink-muted">
              Base price for this design. The shop confirms the final price.
            </p>
          </>
        )}
        {minOrder && (
          <p className="text-xs text-ink-body mt-2.5 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-taupe shrink-0" />
            Minimum quantity: <span className="font-semibold text-ink">{minOrder} pieces</span>
          </p>
        )}
      </div>

      {/* 4. Production Estimate Row */}
      {item.estimated_days && (
        <div className="flex items-start gap-0 py-3.5 border-b border-line">
          <span className="w-[110px] shrink-0 text-sm text-ink-muted">
            Production<br />Estimate
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink">
                {formatTurnaround(item.estimated_days, item.estimated_days_max)}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1 leading-snug">
              Estimated completion based on the shop&apos;s configured production time.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
