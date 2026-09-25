import React from 'react';
import { Clock, Scissors, Star } from 'lucide-react';
import { PublicService } from '../types';
import { getMediaUrl } from '@/lib/media';
import { getActiveSale } from '@/lib/salePricing';

interface ServiceCardItemProps {
  readonly service: PublicService;
  readonly isHighlighted: boolean;
  readonly onSelect: (id: number) => void;
}

export default function ServiceCardItem({
  service,
  isHighlighted,
  onSelect,
}: ServiceCardItemProps) {
  const activeSale = service.base_price
    ? getActiveSale({
        price: service.base_price,
        sale_price: service.sale_price,
        sale_starts_at: service.sale_starts_at,
        sale_ends_at: service.sale_ends_at,
      })
    : null;

  return (
    // Same card visual language as SearchServicesTab's service card on
    // /search — flat (no rounded corners), aspect-4/3 image, compact type
    // scale — just wired to onSelect (in-page detail expand) instead of a
    // route Link, since this card lives on the store's own page already.
    <div
      id={`service-item-${service.id}`}
      onClick={() => onSelect(service.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(service.id);
      }}
      className={`group flex flex-col justify-between w-full bg-surface border border-line hover:border-taupe transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.98] ${
        isHighlighted ? 'ring-2 ring-taupe' : ''
      }`}
    >
      <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
        {service.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getMediaUrl(service.image_url)}
            alt={service.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint">
            <Scissors size={24} className="text-taupe/40" />
          </div>
        )}
      </div>

      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          {service.reviews_avg_rating && Number(service.reviews_avg_rating) > 0 ? (
            <div className="flex items-center gap-1 mb-1 h-3.5">
              <Star size={10} className="fill-amber-400 text-amber-500 shrink-0" />
              <span className="text-[10px] font-semibold text-ink">
                {Number(service.reviews_avg_rating).toFixed(1)}
              </span>
              {(service.reviews_count ?? 0) > 0 && (
                <span className="text-[10px] text-ink-faint">({service.reviews_count})</span>
              )}
            </div>
          ) : null}
          <span className="text-[9px] font-medium uppercase tracking-wide text-taupe truncate block">
            {service.category || service.service_type || 'Tailoring Service'}
          </span>
          <h4 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-0.5 line-clamp-2">
            {service.name}
          </h4>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-line/50 mt-2">
          <span className="text-xs font-bold text-ink truncate">
            {activeSale ? (
              <span className="flex items-center gap-1.5">
                <span className="line-through text-ink-faint text-[10px] font-normal">
                  ₱{activeSale.original.toLocaleString()}
                </span>
                <span className="text-rose-600">₱{activeSale.sale.toLocaleString()}</span>
              </span>
            ) : service.base_price !== null && service.base_price !== undefined ? (
              `₱${Number(service.base_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}`
            ) : (
              'Custom Quote'
            )}
          </span>

          <span className="flex items-center gap-1 text-[10px] text-ink-muted font-medium shrink-0 ml-1">
            <Clock size={10} className="text-taupe shrink-0" />
            <span>Est. {service.estimated_days ? `${service.estimated_days}d` : '7-10d'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
