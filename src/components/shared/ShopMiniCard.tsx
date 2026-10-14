import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Star, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

interface ShopMiniCardProps {
  readonly name: string;
  readonly href: string;
  readonly logoPath?: string | null;
  readonly rating?: number | string | null;
  readonly reviewsCount?: number;
}

/** The shop a service or design belongs to, on one row: logo, the full name, rating and reviews, and View shop. */
export default function ShopMiniCard({ name, href, logoPath, rating, reviewsCount = 0 }: ShopMiniCardProps) {
  const avg = rating ? Number(rating) : 0;
  return (
    <Link href={href} className="card-soft flex items-center gap-3 p-3 transition-opacity active:opacity-80">
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken">
        {logoPath ? <Image src={getMediaUrl(logoPath)} alt="" fill className="object-cover" /> : <Store size={18} className="text-ink-faint" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="mobile-h4 block truncate text-ink">{name}</span>
        <span className="mobile-caption flex items-center gap-1 text-ink-muted">
          {avg > 0 ? (
            <><Star size={12} className="fill-amber-400 text-amber-500" /> {avg.toFixed(1)} · {reviewsCount} review{reviewsCount === 1 ? '' : 's'}</>
          ) : 'New on SUTURA'}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-taupe">View shop <ChevronRight size={16} /></span>
    </Link>
  );
}
