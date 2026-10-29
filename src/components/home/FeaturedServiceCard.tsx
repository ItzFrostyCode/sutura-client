import Link from 'next/link';
import { Clock, Heart, Scissors, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { SERVICE_GROUPS, type ServiceGroupKey } from '@/lib/garmentTaxonomy';
import type { StoreResult } from './homeTypes';

export type FeaturedService = NonNullable<StoreResult['services']>[number];

/** A shop's services, those with a picture first, then the most ordered: the four shown (and the cover photo) are its best. */
export function orderedServices(store: StoreResult): FeaturedService[] {
  return [...(store.services ?? [])].sort((a, b) =>
    Number(!!b.image_url) - Number(!!a.image_url) || (b.orders_count ?? 0) - (a.orders_count ?? 0) || a.id - b.id);
}

const peso = (value: number | string) => `₱${Number(value).toLocaleString('en-PH')}`;

interface FeaturedServiceCardProps {
  readonly service: FeaturedService;
  readonly href: string;
  readonly hovered: boolean;
  readonly saved: boolean;
  /** Only called on a wide screen with a mouse (see useHoverPreview). */
  readonly onHoverChange: (on: boolean) => void;
  readonly onToggleSave: () => void;
}

/**
 * A service in the featured card: the same details as the service card on the map and Search (name, kind of work,
 * price, rating | sold | saved, turnaround), without the location and distance: the shop is already the one on show.
 */
export default function FeaturedServiceCard({ service, href, hovered, saved, onHoverChange, onToggleSave }: FeaturedServiceCardProps) {
  const kind = service.service_category && service.service_category in SERVICE_GROUPS
    ? SERVICE_GROUPS[service.service_category as ServiceGroupKey].label
    : (service.service_category ?? 'Tailoring Service').replace(/_/g, ' ');
  const hasPrice = service.base_price !== null && service.base_price !== undefined && service.base_price !== '';
  const onSale = hasPrice && service.sale_price != null && Number(service.sale_price) < Number(service.base_price);
  const rating = Number(service.reviews_avg_rating) > 0 ? Number(service.reviews_avg_rating).toFixed(1) : '0.0';
  const turnaround = (service.estimated_days ? 'Est. ' : '') + formatServiceTurnaround(service.estimated_days, service.estimated_days_max);
  const saves = (service.saves_count ?? 0) + (saved ? 1 : 0);

  return (
    <Link
      href={href}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={`group/svc flex min-w-0 flex-col overflow-hidden rounded-xl border bg-[#FAF7F4] transition-colors ${hovered ? 'border-taupe bg-sunken ring-2 ring-taupe/20' : 'border-line hover:border-line-strong'}`}
    >
      {/* The photo runs edge to edge: no margin at the top, left or right. */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-sunken lg:aspect-[2/1]">
        {service.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediaUrl(service.image_url)} alt={service.name} className="h-full w-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><Scissors size={18} className="text-taupe/40" /></div>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
          aria-label={saved ? 'Remove from saved' : 'Save service'}
          className="absolute right-1.5 top-1.5 z-10 rounded-full bg-white/90 p-1.5 text-ink-muted shadow-2xs transition-transform active:scale-90 hover:bg-white hover:text-rose-500"
        >
          <Heart size={12} className={saved ? 'fill-rose-500 text-rose-500' : ''} />
        </button>
      </div>

      {/* The details have the margin. */}
      <div className="flex min-w-0 flex-col gap-1 p-2.5">
        <h4 className="line-clamp-1 text-xs font-semibold leading-snug text-ink transition-colors group-hover/svc:text-taupe">{service.name}</h4>
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-taupe">{kind}</p>
        {onSale ? (
          <p className="flex items-center gap-1.5">
            <span className="text-[10px] text-ink-faint line-through">{peso(service.base_price!)}</span>
            <span className="text-xs font-bold text-rose-600">{peso(service.sale_price!)}</span>
          </p>
        ) : hasPrice ? (
          <p className="text-xs font-bold text-ink"><span className="font-normal text-ink-muted">From </span>{peso(service.base_price!)}</p>
        ) : (
          <p className="text-xs font-bold text-ink">Depends on the item</p>
        )}
        <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
          <span className="flex shrink-0 items-center gap-0.5 font-semibold text-ink"><Star size={10} className="shrink-0 fill-amber-400 text-amber-500" />{rating}</span>
          <span aria-hidden className="text-ink-faint">|</span>
          <span className="truncate">{service.orders_count ?? 0} sold</span>
          <span aria-hidden className="text-ink-faint">|</span>
          <span className="flex shrink-0 items-center gap-0.5 text-rose-600" title={`${saves} favorites`}><Heart size={10} className="shrink-0 fill-rose-500 text-rose-500" />{saves}</span>
        </div>
        <p className="flex items-center gap-1 text-[10px] text-ink-muted" title={turnaround}>
          <Clock size={10} className="shrink-0 text-taupe" /><span className="truncate">{turnaround}</span>
        </p>
      </div>
    </Link>
  );
}
