import React from 'react';
import { Clock, Scissors, Star, MapPin, Pencil, Trash2 } from 'lucide-react';
import { PublicService } from '../types';
import { getMediaUrl } from '@/lib/media';
import { getActiveSale } from '@/lib/salePricing';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { SERVICE_TYPE_LABELS } from '@/lib/canonicalTaxonomy';

interface ServiceCardItemProps {
  readonly service: PublicService;
  readonly isHighlighted: boolean;
  readonly onSelect: (id: number) => void;
  readonly storeDistrict?: string | null;
  readonly canManage?: boolean;
  readonly onEdit?: (id: number) => void;
  readonly onDelete?: (id: number) => void;
}

/**
 * Service Card for Storefront Services Tab (/store/[store_id]?tab=services).
 * Sequential structure per user specification:
 * 1. Image Thumbnail
 * 2. Name
 * 3. Service Type
 * 4. Price
 * 5. Star (Average Rating) | (count) sold
 * 6. Clock {estimated exact count days day-day/monthday - day}
 * 7. Location
 */
export default function ServiceCardItem({
  service,
  isHighlighted,
  onSelect,
  storeDistrict,
  canManage,
  onEdit,
  onDelete,
}: ServiceCardItemProps) {
  const activeSale = service.base_price
    ? getActiveSale({
        price: service.base_price,
        sale_price: service.sale_price,
        sale_starts_at: service.sale_starts_at,
        sale_ends_at: service.sale_ends_at,
      })
    : null;

  const turnaroundText = (service.estimated_days ? 'Est. ' : '') + formatServiceTurnaround(service.estimated_days, service.estimated_days_max);
  const locationText = storeDistrict ? `${storeDistrict}, Davao City` : 'Davao City';
  // Prefer the canonical Services taxonomy label over the legacy free-text
  // service_type/category fields — matches ServiceAccordionSections.tsx's
  // own Category row so the badge shown here and on the detail page agree.
  const rawType = service.service_leaf_type
    ? SERVICE_TYPE_LABELS[service.service_leaf_type] ?? service.service_leaf_type
    : service.service_type || service.category || 'Tailoring Service';
  const serviceTypeDisplay = rawType.replace(/_/g, ' ');
  const soldCount = service.orders_count ?? service.reviews_count ?? 0;

  return (
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
      {/* 1. Image Thumbnail */}
      <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
        {service.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getMediaUrl(service.image_url)}
            alt={service.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const placeholder = parent.querySelector('.service-card-fallback');
                if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className={`service-card-fallback w-full h-full items-center justify-center text-ink-faint ${service.image_url ? 'hidden' : 'flex'}`}
        >
          <Scissors size={24} className="text-taupe/40" />
        </div>

        {canManage && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit?.(service.id); }}
              aria-label="Edit service"
              className="w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white text-ink border border-line shadow-xs transition-colors cursor-pointer"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete?.(service.id); }}
              aria-label="Delete service"
              className="w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-rose-50 text-danger border border-line shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Card Info Body - Sequential order per user spec */}
      <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
        <div className="space-y-1">
          {/* 2. Name */}
          <h3 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug line-clamp-1">
            {service.name}
          </h3>

          {/* 3. Service Type */}
          <span className="text-[10px] font-medium uppercase tracking-wide text-taupe truncate block">
            {serviceTypeDisplay}
          </span>

          {/* 4. Price */}
          <div>
            {activeSale ? (
              <div className="flex items-center gap-1.5">
                <span className="line-through text-ink-faint text-[10px] font-normal">
                  ₱{activeSale.original.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-rose-600">
                  ₱{activeSale.sale.toLocaleString()}
                </span>
              </div>
            ) : service.base_price !== null && service.base_price !== undefined ? (
              <p className="text-xs font-bold text-ink">
                ₱{Number(service.base_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            ) : (
              <p className="text-xs font-bold text-ink">Custom Quote</p>
            )}
          </div>

          {/* 5. Star (Average Rating) | (count) sold */}
          <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
            <div className="flex items-center gap-0.5 shrink-0">
              <Star size={10} className="fill-amber-400 text-amber-500 shrink-0" />
              <span className="font-semibold text-ink">
                {service.reviews_avg_rating && Number(service.reviews_avg_rating) > 0
                  ? Number(service.reviews_avg_rating).toFixed(1)
                  : '0.0'}
              </span>
            </div>
            <span className="text-ink-faint">|</span>
            <span className="truncate">{soldCount} sold</span>
          </div>

          {/* 6. Clock {estimated exact count days day-day/monthday - day} */}
          <div
            className="flex items-center gap-1 text-[10px] text-ink-muted truncate"
            title={turnaroundText}
          >
            <Clock size={10} className="text-taupe shrink-0" />
            <span className="truncate">{turnaroundText}</span>
          </div>
        </div>

        {/* 7. Location */}
        <div className="flex items-center gap-1 text-[10px] text-ink-faint truncate pt-1 border-t border-line/50">
          <MapPin size={10} className="text-taupe/70 shrink-0" />
          <span className="truncate">{locationText}</span>
        </div>
      </div>
    </div>
  );
}

