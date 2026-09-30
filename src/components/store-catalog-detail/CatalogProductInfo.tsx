import React from 'react';
import { Star } from 'lucide-react';
import { CatalogItem } from './types';
import { formatTurnaround } from '@/lib/formatTurnaround';

interface CatalogProductInfoProps {
  item: CatalogItem;
  isSaved?: boolean;
  /** Owner view: ratings and sold counts are customer activity, not part of the design itself. */
  hideStats?: boolean;
}

export default function CatalogProductInfo({ item, hideStats }: CatalogProductInfoProps) {
  const avgRating = item.reviews_avg_rating ?? 0;
  const reviewsCount = item.reviews_count ?? 0;

  return (
    <div className="space-y-0">
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
        <p className="text-3xl font-bold text-taupe leading-none">
          ₱{Number(item.price).toLocaleString()}
        </p>
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
