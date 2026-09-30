import React from 'react';
import { Star } from 'lucide-react';
import { PublicService } from '@/components/store-storefront/types';
import { getActiveSale } from '@/lib/salePricing';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';

interface ServiceProductInfoProps {
  service: PublicService;
  /** Owner view: ratings and sold counts are customer activity, not part of the service itself. */
  hideStats?: boolean;
}

// Same block, same order and same look as the Catalog Design's
// CatalogProductInfo: name → stats → price banner → turnaround.
export default function ServiceProductInfo({ service, hideStats }: ServiceProductInfoProps) {
  const avgRating = Number(service.reviews_avg_rating ?? 0);
  const reviewsCount = service.reviews_count ?? 0;

  const sale = service.base_price
    ? getActiveSale({
        price: service.base_price,
        sale_price: service.sale_price,
        sale_starts_at: service.sale_starts_at,
        sale_ends_at: service.sale_ends_at,
      })
    : null;
  const hasPrice = service.base_price !== null && service.base_price !== undefined && service.base_price !== '';

  return (
    <div className="space-y-0">
      <h1 className="text-xl font-semibold text-ink leading-snug pb-3">{service.name}</h1>

      {!hideStats && (
        <div className="flex items-center gap-2.5 pb-3 border-b border-line flex-wrap text-sm">
          <span className="font-bold text-taupe underline underline-offset-2">{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={14} className={n <= Math.round(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-line-strong'} />
            ))}
          </div>
          <div className="w-px h-4 bg-line" />
          <span className="text-ink-muted">{reviewsCount} Ratings</span>
          <div className="w-px h-4 bg-line" />
          <span className="text-ink-muted">{service.orders_count ?? 0} Sold</span>
        </div>
      )}

      <div className="bg-[#fafafa] border border-line px-4 py-4">
        {sale ? (
          <p className="flex items-baseline gap-2 leading-none">
            <span className="text-3xl font-bold text-rose-600">₱{sale.sale.toLocaleString()}</span>
            <span className="line-through text-ink-faint text-base">₱{sale.original.toLocaleString()}</span>
          </p>
        ) : hasPrice ? (
          <p className="text-3xl font-bold text-taupe leading-none">₱{Number(service.base_price).toLocaleString()}</p>
        ) : (
          <p className="text-3xl font-bold text-taupe leading-none">Custom Quote</p>
        )}
      </div>

      {(
        <div className="flex items-start gap-0 py-3.5 border-b border-line">
          <span className="w-[110px] shrink-0 text-sm text-ink-muted">
            Production<br />Estimate
          </span>
          <div className="flex-1">
            <span className="text-sm font-bold text-ink">{formatServiceTurnaround(service.estimated_days, service.estimated_days_max)}</span>
            <p className="text-xs text-ink-muted mt-1 leading-snug">{service.estimated_days ? 'Estimated completion based on the shop\u2019s configured turnaround time.' : 'The shop confirms the time once it knows what you need.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
