'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Clock, Pencil, Scissors, Trash2, Star, Heart } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getActiveSale } from '@/lib/salePricing';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import type { CatalogListItem, PublicService } from '../types';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
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
 * One service on the storefront: picture, name, price, ratings, sold count, favorites, turnaround,
 * and under it the strip of designs made under this service styled like the platform catalog cards (From the Same Shop).
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
      className={`min-w-0 scroll-mt-28 rounded-2xl bg-surface border border-line p-4 transition-all duration-500 ${
        isHighlighted ? 'bg-taupe/10 ring-2 ring-taupe' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Link href={href} onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 transition-opacity active:opacity-80">
          <span className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sunken text-ink-faint border border-line">
            {service.image_url ? <Image src={getMediaUrl(service.image_url)} alt="" fill sizes="76px" className="object-cover" /> : <Scissors size={24} />}
          </span>
          <span className="min-w-0 flex-1 space-y-1">
            <span className="mobile-h4 line-clamp-2 text-ink">{service.name}</span>
            <span className="mobile-body-sm block text-ink-body">
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
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
              <div className="flex items-center gap-1 shrink-0">
                <Star size={11} className="fill-amber-400 text-amber-500 shrink-0" />
                <span className="font-semibold text-ink">
                  {service.reviews_avg_rating && Number(service.reviews_avg_rating) > 0
                    ? Number(service.reviews_avg_rating).toFixed(1)
                    : '0.0'}
                </span>
              </div>
              <span className="text-ink-faint">|</span>
              <span className="truncate">{service.orders_count ?? 0} sold</span>
              <span className="text-ink-faint">|</span>
              <span className="flex items-center gap-0.5 text-rose-600 shrink-0">
                <Heart size={10} className="fill-rose-500 text-rose-500 shrink-0" />
                <span>{service.saves_count ?? 0}</span>
              </span>
              <span className="text-ink-faint">|</span>
              <span className="flex items-center gap-1 truncate">
                <Clock size={11} className="text-taupe shrink-0" /> {service.estimated_days ? 'Est. ' : ''}{formatServiceTurnaround(service.estimated_days ?? null, service.estimated_days_max ?? null)}
              </span>
            </div>
          </span>
          {!canManage && <ChevronRight size={18} className="shrink-0 text-ink-faint ml-1" />}
        </Link>
        {canManage && (
          <span className="flex shrink-0 gap-1">
            <button type="button" onClick={() => onEdit?.(service.id)} aria-label={`Edit ${service.name}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-sunken hover:bg-canvas text-ink"><Pencil size={15} /></button>
            <button type="button" onClick={() => onDelete?.(service.id)} aria-label={`Delete ${service.name}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-sunken hover:bg-rose-50 text-danger"><Trash2 size={15} /></button>
          </span>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-line">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="mobile-overline text-ink-faint">Designs{designs.length ? ` · ${designs.length}` : ''}</p>
          {designs.length > 0 && (
            <Link href={href} onClick={onOpen} className="-mr-1 flex min-h-9 items-center gap-0.5 px-1 text-xs font-semibold text-taupe hover:underline">See all <ChevronRight size={14} /></Link>
          )}
        </div>
        {designsLoading ? (
          <p className="mobile-caption text-ink-faint">Loading designs…</p>
        ) : designs.length === 0 ? (
          <p className="mobile-caption text-ink-muted">No designs yet — book it and the shop will design it with you.</p>
        ) : (
          <div className="hide-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
            {designs.map((d) => {
              const itemResult: CatalogItemResult = {
                id: d.id,
                name: d.name,
                price: d.price,
                estimated_days: d.estimated_days ?? null,
                material: d.material,
                garment_type: d.garment_type,
                color: d.color,
                description: d.description,
                images: (d.images ?? []).map((img, idx) => ({
                  id: img.id ?? idx,
                  catalog_item_id: d.id,
                  image_url: img.image_url,
                  view_angle: img.view_angle,
                  is_primary: Boolean(img.is_primary),
                  sort_order: idx,
                })),
                reviews_avg_rating: d.reviews_avg_rating ?? null,
                reviews_count: d.reviews_count ?? 0,
                order_count: (d as any).order_count ?? 0,
                saves_count: (d as any).saves_count ?? 0,
                service_id: service.id,
                service_name: service.name,
                service: { id: service.id, name: service.name },
                pricing: (d as any).pricing ?? null,
              };

              return (
                <div key={d.id} className="w-[170px] sm:w-[195px] shrink-0 snap-start flex">
                  <CatalogItemCard
                    item={itemResult}
                    canManage={canManage}
                    onDelete={onDeleteDesign}
                    hideLocation
                    hrefOverride={`/store/${storeId}/catalog/${d.id}${embedSuffix(embedded)}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
