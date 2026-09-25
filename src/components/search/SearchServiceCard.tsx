import Link from 'next/link';
import Image from 'next/image';
import { Scissors, Star, Clock } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { SearchServiceResult } from './types';

interface SearchServiceCardProps {
  readonly service: SearchServiceResult;
  readonly storeSlug: string;
  readonly gate: (href: string) => string;
}

export default function SearchServiceCard({
  service,
  storeSlug,
  gate,
}: SearchServiceCardProps) {
  const priceDisplay =
    service.base_price !== null && service.base_price !== undefined
      ? `₱${Number(service.sale_price ?? service.base_price).toLocaleString(undefined, {
          minimumFractionDigits: 0,
        })}`
      : 'Custom Quote';

  const serviceHref = gate(`/store/${storeSlug}?tab=services&service_id=${service.id}`);

  return (
    <Link
      href={serviceHref}
      className="snap-start shrink-0 w-[70%] min-w-[220px] max-w-[270px] sm:w-[250px] md:w-[270px] bg-surface border border-line hover:border-taupe transition-all duration-300 flex flex-col justify-between overflow-hidden group active:scale-[0.98]"
    >
      <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
        {service.image_url ? (
          <Image
            src={getMediaUrl(service.image_url)}
            alt={service.name}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
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
            {service.category || 'Tailoring Service'}
          </span>
          <h4 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-0.5 line-clamp-2">
            {service.name}
          </h4>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-line/50 mt-2">
          <span className="text-xs font-bold text-ink truncate">{priceDisplay}</span>
          <span className="flex items-center gap-1 text-[10px] text-ink-muted font-medium shrink-0 ml-1">
            <Clock size={10} className="text-taupe shrink-0" />
            <span>Est. {service.estimated_days ? `${service.estimated_days}d` : '7-10d'}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
