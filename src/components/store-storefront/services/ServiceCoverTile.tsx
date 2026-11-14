import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, Scissors } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { QUOTATION_LABEL, priceLead } from '@/lib/servicePricing';
import { getActiveSale } from '@/lib/salePricing';
import type { PublicService } from '../types';

/** Width of every tile in a service's shelf (this cover + its design cards), so the row lines up. */
export const SHELF_TILE = 'flex w-[170px] shrink-0 snap-start sm:w-[195px]';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

interface ServiceCoverTileProps {
  readonly service: PublicService;
  readonly href: string;
  readonly onOpen?: () => void;
}

/**
 * The first tile of a service's shelf: the service itself. Same 3:4 picture as the design cards beside it (so the
 * pictures line up), with a dark panel under it that holds the offer — price, turnaround and the way in. It opens the
 * service page, where the customer orders online (no booking from here), so the label only says "View service".
 */
export default function ServiceCoverTile({ service, href, onOpen }: ServiceCoverTileProps) {
  const base = Number(service.base_price);
  const quotation = service.price_display === 'quotation' || !(Number.isFinite(base) && base > 0);
  const sale = !quotation
    ? getActiveSale({ price: service.base_price, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at })
    : null;

  return (
    <div className={SHELF_TILE}>
      <Link href={href} onClick={onOpen} aria-label={`View ${service.name}`} className="group flex w-full flex-col overflow-hidden bg-ink text-white">
        <span className="relative block aspect-3/4 shrink-0 overflow-hidden bg-sunken text-ink-faint">
          {service.image_url ? (
            <Image src={getMediaUrl(service.image_url)} alt="" fill sizes="195px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <span className="flex h-full w-full items-center justify-center"><Scissors size={24} aria-hidden /></span>
          )}
          <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white">Service</span>
        </span>
        <span className="flex flex-1 flex-col justify-between gap-3 p-3">
          <span className="block space-y-1">
            {quotation ? (
              <span className="block text-sm font-semibold leading-snug">{QUOTATION_LABEL}</span>
            ) : sale ? (
              <span className="block text-base font-semibold leading-snug">
                {peso(Number(sale.sale))} <span className="text-xs font-normal text-white/50 line-through">{peso(base)}</span>
              </span>
            ) : (
              <span className="block text-base font-semibold leading-snug">
                <span className="text-xs font-normal text-white/60">{priceLead(service.price_display)}</span>{peso(base)}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-white/70">
              <Clock size={11} className="shrink-0" aria-hidden />
              <span className="truncate">{service.estimated_days ? 'Est. ' : ''}{formatServiceTurnaround(service.estimated_days ?? null, service.estimated_days_max ?? null)}</span>
            </span>
          </span>
          <span className="flex min-h-11 items-center justify-between border-t border-white/15 pt-2 text-[13px] font-semibold">
            View service
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </span>
      </Link>
    </div>
  );
}
