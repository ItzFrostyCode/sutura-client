import Link from 'next/link';
import Image from 'next/image';
import { Clock, Scissors, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';

interface ServiceMiniCardProps {
  readonly href: string;
  readonly name: string;
  readonly imageUrl: string | null;
  /** The small line above the name: the shop, or the service category. */
  readonly eyebrow: string;
  readonly basePrice: string | number | null;
  readonly estimatedDays: number | null;
  readonly estimatedDaysMax?: number | null;
  readonly rating: number | null;
  readonly reviewsCount: number;
}

/** A service as a small soft card (picture, rating, shop, name, price and how long it takes) — used by Saved Items and Recently Viewed. */
export default function ServiceMiniCard({ href, name, imageUrl, eyebrow, basePrice, estimatedDays, estimatedDaysMax, rating, reviewsCount }: ServiceMiniCardProps) {
  const price = basePrice !== null && basePrice !== undefined ? `₱${Number(basePrice).toLocaleString(undefined, { minimumFractionDigits: 0 })}` : 'Custom Quote';

  return (
    <Link href={href} className="card-soft group flex flex-col overflow-hidden transition-transform active:scale-[0.98]">
      <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-sunken">
        {imageUrl ? (
          <Image src={getMediaUrl(imageUrl)} alt={name} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><Scissors size={24} className="text-taupe/40" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          {rating && Number(rating) > 0 ? (
            <div className="mb-1 flex h-3.5 items-center gap-1">
              <Star size={10} className="shrink-0 fill-amber-400 text-amber-500" />
              <span className="text-[10px] font-semibold text-ink">{Number(rating).toFixed(1)}</span>
              {reviewsCount > 0 && <span className="text-[10px] text-ink-faint">({reviewsCount})</span>}
            </div>
          ) : null}
          <span className="block truncate text-[10px] uppercase tracking-wide text-taupe">{eyebrow}</span>
          <h4 className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-ink">{name}</h4>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="truncate text-xs font-bold text-ink">{price}</span>
          <span className="ml-1 flex shrink-0 items-center gap-1 text-[10px] text-ink-muted">
            <Clock size={10} className="shrink-0 text-taupe" />
            {estimatedDays ? 'Est. ' : ''}{formatServiceTurnaround(estimatedDays, estimatedDaysMax)}
          </span>
        </div>
      </div>
    </Link>
  );
}
