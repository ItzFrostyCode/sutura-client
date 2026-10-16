'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Clock, Pencil, Scissors, Trash2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getActiveSale } from '@/lib/salePricing';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import type { CatalogListItem, PublicService } from '../types';
import DesignTile from './DesignTile';
import { embedSuffix } from '@/hooks/useEmbedded';

interface ServiceRowProps {
  readonly service: PublicService;
  readonly storeId: string;
  readonly designs: CatalogListItem[];
  readonly designsLoading: boolean;
  readonly onOpen?: () => void;
  readonly canManage?: boolean;
  readonly onEdit?: (id: number) => void;
  readonly onDelete?: (id: number) => void;
  readonly onDeleteDesign?: (id: number) => void;
  /** Inside the map panel: links keep ?embed=1. */
  readonly embedded?: boolean;
  readonly isHighlighted?: boolean;
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

/**
 * One service on the storefront, flat (it already sits inside the page or the map panel — no card of its own): its picture, name,
 * price and how long it takes (tapping it opens the service page), and under it a strip of the designs made under this service — tap a design for its page, or "See all" for the service
 * page with every design in two columns.
 */
export default function ServiceRow({ service, storeId, designs, designsLoading, onOpen, canManage, onEdit, onDelete, onDeleteDesign, embedded = false, isHighlighted = false }: ServiceRowProps) {
  const href = `/store/${storeId}/service/${service.id}${embedSuffix(embedded)}`;
  const base = Number(service.base_price);
  const sale = service.base_price
    ? getActiveSale({ price: service.base_price, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at })
    : null;

  return (
    <article
      id={`service-item-${service.id}`}
      className={`min-w-0 scroll-mt-28 rounded-2xl transition-all duration-500 ${
        isHighlighted ? 'bg-taupe/10 ring-2 ring-taupe p-3 -m-3' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Link href={href} onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 transition-opacity active:opacity-80">
          <span className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sunken text-ink-faint">
            {service.image_url ? <Image src={getMediaUrl(service.image_url)} alt="" fill sizes="72px" className="object-cover" /> : <Scissors size={22} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="mobile-h4 line-clamp-2 block text-ink">{service.name}</span>
            <span className="mobile-body-sm mt-0.5 block text-ink-body">
              {Number.isFinite(base) && base > 0 ? (
                sale ? (
                  <>From <span className="font-semibold text-danger">{peso(sale.sale)}</span> <span className="text-ink-faint line-through">{peso(base)}</span></>
                ) : (
                  <>From <span className="font-semibold text-ink">{peso(base)}</span></>
                )
              ) : (
                <span className="text-ink-muted">Price on consultation</span>
              )}
            </span>
            <span className="mobile-caption mt-0.5 flex items-center gap-1 text-ink-muted">
              <Clock size={12} className="shrink-0" /> {service.estimated_days ? 'Est. ' : ''}{formatServiceTurnaround(service.estimated_days ?? null, service.estimated_days_max ?? null)}
            </span>
          </span>
          {!canManage && <ChevronRight size={18} className="shrink-0 text-ink-faint" />}
        </Link>
        {canManage && (
          <span className="flex shrink-0 gap-1">
            <button type="button" onClick={() => onEdit?.(service.id)} aria-label={`Edit ${service.name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-ink"><Pencil size={16} /></button>
            <button type="button" onClick={() => onDelete?.(service.id)} aria-label={`Delete ${service.name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-danger"><Trash2 size={16} /></button>
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="mobile-overline text-ink-faint">Designs{designs.length ? ` · ${designs.length}` : ''}</p>
          {designs.length > 0 && (
            <Link href={href} onClick={onOpen} className="-mr-1 flex min-h-11 items-center gap-0.5 px-1 text-sm text-taupe">See all <ChevronRight size={16} /></Link>
          )}
        </div>
        {designsLoading ? (
          <p className="mobile-caption text-ink-faint">Loading designs…</p>
        ) : designs.length === 0 ? (
          <p className="mobile-caption text-ink-muted">No designs yet — book it and the shop will design it with you.</p>
        ) : (
          <div className="hide-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
            {designs.map((d) => (
              <DesignTile key={d.id} item={d} href={`/store/${storeId}/catalog/${d.id}${embedSuffix(embedded)}`} className="w-[118px] shrink-0 snap-start" onDelete={canManage ? onDeleteDesign : undefined} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
