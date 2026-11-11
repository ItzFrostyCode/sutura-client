'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Clock, Pencil, Scissors, Trash2 } from 'lucide-react';
import ItemStats from '@/components/shared/ItemStats';
import { getMediaUrl } from '@/lib/media';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { QUOTATION_LABEL, priceLead } from '@/lib/servicePricing';
import { SERVICE_GROUPS, type ServiceGroupKey } from '@/lib/garmentTaxonomy';
import { getActiveSale } from '@/lib/salePricing';
import type { CatalogListItem, PublicService } from '../types';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import DragScrollRow from '@/components/shared/DragScrollRow';
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
 * One service on the shop page: the service on top — photo, name, kind of work, price, rating | sold | saved,
 * turnaround (the same details, in the same order and style, as the service card in the Shops list and Search; no
 * location or distance, the shop is the one open) — then its designs as design cards in a row that slides.
 */
export default function ServiceRow({ service, storeId, designs, designsLoading, onOpen, canManage, onEdit, onDelete, onDeleteDesign, embedded = false, isHighlighted = false }: ServiceRowProps) {
  const href = `/store/${storeId}/service/${service.id}${embedSuffix(embedded)}`;
  const base = Number(service.base_price);
  const kind = (service.service_category && service.service_category in SERVICE_GROUPS
    ? SERVICE_GROUPS[service.service_category as ServiceGroupKey].label
    : service.service_type || service.category || 'Tailoring Service').replace(/_/g, ' ');
  const sale = service.base_price
    ? getActiveSale({ price: service.base_price, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at })
    : null;

  return (
    <article
      id={`service-item-${service.id}`}
      className={`min-w-0 scroll-mt-28 rounded-2xl border border-line bg-surface p-4 transition-all duration-500 ${isHighlighted ? 'bg-taupe/10 ring-2 ring-taupe' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Link href={href} onClick={onOpen} className="group flex min-w-0 flex-1 items-center gap-3 transition-opacity active:opacity-80">
          <span className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sunken text-ink-faint">
            {service.image_url ? <Image src={getMediaUrl(service.image_url)} alt="" fill sizes="84px" className="object-cover" /> : <Scissors size={24} />}
          </span>
          <span className="min-w-0 flex-1 space-y-0.5">
            <span className="block line-clamp-2 break-words text-base font-semibold leading-snug text-ink group-hover:text-taupe">{service.name}</span>
            <span className="block truncate text-xs font-medium uppercase tracking-wide text-taupe">{kind}</span>
            <span className="block text-sm text-ink-body">
              {service.price_display === 'quotation' || !(Number.isFinite(base) && base > 0) ? (
                <span className="font-semibold text-ink">{QUOTATION_LABEL}</span>
              ) : sale ? (
                <><span className="font-semibold text-rose-600">{peso(Number(sale.sale))}</span> <span className="text-xs text-ink-faint line-through">{peso(base)}</span></>
              ) : (
                <><span className="text-ink-muted">{priceLead(service.price_display)}</span><span className="font-semibold text-ink">{peso(base)}</span></>
              )}
            </span>
            <ItemStats rating={service.reviews_avg_rating} sold={service.orders_count} saves={service.saves_count} />
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Clock size={10} className="shrink-0 text-taupe" aria-hidden /> {service.estimated_days ? 'Est. ' : ''}{formatServiceTurnaround(service.estimated_days ?? null, service.estimated_days_max ?? null)}
            </span>
          </span>
          {!canManage && <ChevronRight size={18} className="ml-1 shrink-0 text-ink-faint" aria-hidden />}
        </Link>
        {canManage && (
          <span className="flex shrink-0 gap-1">
            <button type="button" onClick={() => onEdit?.(service.id)} aria-label={`Edit ${service.name}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-sunken text-ink hover:bg-canvas"><Pencil size={15} /></button>
            <button type="button" onClick={() => onDelete?.(service.id)} aria-label={`Delete ${service.name}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-sunken text-danger hover:bg-rose-50"><Trash2 size={15} /></button>
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="mobile-overline text-ink-faint">Designs{designs.length ? ` · ${designs.length}` : ''}</p>
          {designs.length > 0 && (
            <Link href={href} onClick={onOpen} className="-mr-1 flex min-h-11 items-center gap-0.5 px-1 text-sm font-semibold text-taupe-dark hover:underline">See all <ChevronRight size={14} /></Link>
          )}
        </div>
        {designsLoading ? (
          <p className="mobile-caption text-ink-faint">Loading designs…</p>
        ) : designs.length === 0 ? (
          <p className="mobile-caption text-ink-muted">No designs yet — book it and the shop will design it with you.</p>
        ) : (
      <DragScrollRow className="pb-2" label={`${service.name} designs`}>
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
                    hideServiceName
                    hrefOverride={`/store/${storeId}/catalog/${d.id}${embedSuffix(embedded)}`}
                  />
                </div>
              );
            })}
      </DragScrollRow>
        )}
      </div>
    </article>
  );
}
