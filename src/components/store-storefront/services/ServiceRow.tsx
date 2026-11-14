'use client';

import Link from 'next/link';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import ItemStats from '@/components/shared/ItemStats';
import { SERVICE_GROUPS, type ServiceGroupKey } from '@/lib/garmentTaxonomy';
import type { CatalogListItem, PublicService } from '../types';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import DragScrollRow from '@/components/shared/DragScrollRow';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { embedSuffix } from '@/hooks/useEmbedded';
import ServiceCoverTile, { SHELF_TILE } from './ServiceCoverTile';

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

const toCard = (d: CatalogListItem, service: PublicService): CatalogItemResult => ({
  id: d.id,
  name: d.name,
  price: d.price,
  estimated_days: d.estimated_days ?? null,
  material: d.material,
  garment_type: d.garment_type,
  color: d.color,
  description: d.description,
  images: (d.images ?? []).map((img, idx) => ({ id: img.id ?? idx, catalog_item_id: d.id, image_url: img.image_url, view_angle: img.view_angle, is_primary: Boolean(img.is_primary), sort_order: idx })),
  reviews_avg_rating: d.reviews_avg_rating ?? null,
  reviews_count: d.reviews_count ?? 0,
  order_count: (d as any).order_count ?? 0,
  saves_count: (d as any).saves_count ?? 0,
  service_id: service.id,
  service_name: service.name,
  service: { id: service.id, name: service.name },
  pricing: (d as any).pricing ?? null,
});

/**
 * One service on the shop page, as an open "shelf" (no box around it; services are split by a hairline):
 *   KIND · n designs
 *   Service name                                  (→)
 *   ★ rating | sold | saved
 *   [ SERVICE photo + price + View service ] [design] [design] [design] →
 * The service's own tile leads the row at the same size as its designs, so the picture, the offer and the examples
 * read as one thing instead of a small thumbnail with a separate design strip under it.
 */
export default function ServiceRow({ service, storeId, designs, designsLoading, onOpen, canManage, onEdit, onDelete, onDeleteDesign, embedded = false, isHighlighted = false }: ServiceRowProps) {
  const href = `/store/${storeId}/service/${service.id}${embedSuffix(embedded)}`;
  const kind = (service.service_category && service.service_category in SERVICE_GROUPS
    ? SERVICE_GROUPS[service.service_category as ServiceGroupKey].label
    : service.service_type || service.category || 'Tailoring Service').replace(/_/g, ' ');

  return (
    <article
      id={`service-item-${service.id}`}
      className={`min-w-0 scroll-mt-28 py-8 transition-colors duration-500 first:pt-2 ${isHighlighted ? '-mx-3 rounded-2xl bg-taupe/10 px-3' : ''}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mobile-overline truncate text-taupe-dark">
            {kind}{designs.length > 0 ? <span className="text-ink-faint"> · {designs.length} design{designs.length === 1 ? '' : 's'}</span> : null}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-ink sm:text-xl">
            <Link href={href} onClick={onOpen} className="line-clamp-2 break-words hover:text-taupe">{service.name}</Link>
          </h3>
          <ItemStats className="mt-1.5" rating={service.reviews_avg_rating} sold={service.orders_count} saves={service.saves_count} />
        </div>
        {canManage ? (
          <span className="flex shrink-0 gap-2">
            <button type="button" onClick={() => onEdit?.(service.id)} aria-label={`Edit ${service.name}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink hover:border-ink"><Pencil size={16} /></button>
            <button type="button" onClick={() => onDelete?.(service.id)} aria-label={`Delete ${service.name}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-danger hover:border-danger"><Trash2 size={16} /></button>
          </span>
        ) : (
          <Link href={href} onClick={onOpen} aria-label={`Open ${service.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white">
            <ChevronRight size={18} aria-hidden />
          </Link>
        )}
      </header>

      <DragScrollRow className="pb-2" label={`${service.name} and its designs`}>
        <ServiceCoverTile service={service} href={href} onOpen={onOpen} />
        {designsLoading ? (
          [0, 1].map((i) => <div key={i} className={`${SHELF_TILE} animate-pulse bg-sunken`} aria-hidden />)
        ) : designs.length === 0 ? (
          <div className={`${SHELF_TILE} flex-col justify-center border border-dashed border-line-strong p-4 text-center`}>
            <p className="text-sm font-semibold text-ink">No designs yet</p>
            <p className="mobile-caption mt-1 text-ink-muted">Order it online and the shop will design it with you.</p>
          </div>
        ) : (
          designs.map((d) => (
            <div key={d.id} className={SHELF_TILE}>
              <CatalogItemCard
                item={toCard(d, service)}
                canManage={canManage}
                onDelete={onDeleteDesign}
                hideLocation
                hideServiceName
                hrefOverride={`/store/${storeId}/catalog/${d.id}${embedSuffix(embedded)}`}
              />
            </div>
          ))
        )}
      </DragScrollRow>
    </article>
  );
}
