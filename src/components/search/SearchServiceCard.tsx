import Link from 'next/link';
import Image from 'next/image';
import { Scissors, Star, Clock, MapPin } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { SERVICE_TYPE_LABELS } from '@/lib/canonicalTaxonomy';
import { SearchServiceResult } from './types';

interface SearchServiceCardProps {
  readonly service: SearchServiceResult;
  readonly storeSlug: string;
  readonly gate: (href: string) => string;
  /** Owner grid: open this instead of the public page. */
  readonly hrefOverride?: string;
  /** Owner grid: dims the card and shows a Paused badge. */
  readonly isPaused?: boolean;
  /** Owner grid: every card is the owner's own, so the location line is noise. */
  readonly hideLocation?: boolean;
  /** Fills its grid cell instead of the carousel's fixed width. */
  readonly fluid?: boolean;
}

/**
 * Service Card for browse views (/search Services tab, Nearby Stores services carousel).
 * Sequential structure per user specification:
 * 1. Image Thumbnail
 * 2. Name
 * 3. Service Type
 * 4. Price
 * 5. Star (Average Rating) | (count) sold
 * 6. Clock {estimated exact count days day-day/monthday - day}
 * 7. Location
 */
export default function SearchServiceCard({
  service,
  storeSlug,
  gate,
  hrefOverride,
  isPaused,
  hideLocation,
  fluid,
}: SearchServiceCardProps) {
  const turnaroundText = (service.estimated_days ? 'Est. ' : '') + formatServiceTurnaround(service.estimated_days, service.estimated_days_max);
  const branch = service.store?.branches?.[0];
  const locationText = branch?.district
    ? `${branch.district}, Davao City`
    : (branch?.city || service.store?.name || 'Davao City');

  // Prefer the canonical Services taxonomy label over the legacy free-text
  // service_type/category fields — matches ServiceCardItem.tsx/
  // ServiceAccordionSections.tsx's own Category row so the badge shown here
  // and on the service's own detail page agree.
  const rawType = service.service_leaf_type
    ? SERVICE_TYPE_LABELS[service.service_leaf_type] ?? service.service_leaf_type
    : service.service_type || service.category || 'Tailoring Service';
  const serviceTypeDisplay = rawType.replace(/_/g, ' ');
  const soldCount = service.orders_count ?? service.reviews_count ?? 0;
  const serviceHref = hrefOverride ?? gate(`/store/${storeSlug}/service/${service.id}`);

  return (
    <Link
      href={serviceHref}
      className={`${fluid ? 'w-full h-full' : 'snap-start shrink-0 w-[70%] min-w-[220px] max-w-[270px] sm:w-[250px] md:w-[270px]'} bg-surface border border-line hover:border-taupe transition-all duration-300 flex flex-col justify-between overflow-hidden group active:scale-[0.98]`}
    >
      {/* 1. Image Thumbnail */}
      <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
        {isPaused && (
          <div className="absolute top-1.5 left-1.5 z-10 px-2 py-0.5 bg-ink/85 text-white text-[9px] font-bold uppercase tracking-wider">Paused</div>
        )}
        {service.image_url ? (
          <Image
            src={getMediaUrl(service.image_url)}
            alt={service.name}
            fill
            className={`object-cover object-top transition-transform duration-500 group-hover:scale-105 ${isPaused ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint">
            <Scissors size={24} className="text-taupe/40" />
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
            {service.sale_price !== null && service.sale_price !== undefined && service.base_price !== null && service.sale_price < service.base_price ? (
              <div className="flex items-center gap-1.5">
                <span className="line-through text-ink-faint text-[10px] font-normal">
                  ₱{Number(service.base_price).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-rose-600">
                  ₱{Number(service.sale_price).toLocaleString()}
                </span>
              </div>
            ) : service.base_price !== null && service.base_price !== undefined ? (
              <p className="text-xs font-bold text-ink">
                ₱{Number(service.base_price).toLocaleString()}
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

        {/* 7. Location on left, KM on right */}
        {!hideLocation && <div className="flex items-center justify-between gap-1 text-[10px] text-ink-faint pt-1 border-t border-line/50">
          <div className="flex items-center gap-1 min-w-0 truncate">
            <MapPin size={10} className="text-taupe/70 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
          {service.store?.distance_km != null ? (
            <span className="shrink-0 text-ink-muted font-medium text-[10px] pl-1">
              {Number(service.store.distance_km).toFixed(1)} km
            </span>
          ) : null}
        </div>}
      </div>
    </Link>
  );
}

