'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, Clock, Heart, Pencil, Plus, Scissors, Star, Trash2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { Service } from './serviceHelpers';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

interface DashboardServiceCardProps {
  readonly service: Service;
  readonly canManage?: boolean;
  readonly onEdit?: (id: number) => void;
  readonly onDelete?: (id: number) => void;
  readonly onDeleteDesign?: (id: number) => void;
}

export default function DashboardServiceCard({
  service,
  canManage = false,
  onEdit,
  onDelete,
  onDeleteDesign,
}: DashboardServiceCardProps) {
  const router = useRouter();
  const designs = service.catalog_items ?? (service as any).catalogItems ?? [];
  const base = service.base_price ? Number(service.base_price) : 0;
  const href = `/dashboard/services/${service.id}`;
  const designsHref = `/dashboard/catalog?service_id=${service.id}`;

  return (
    <article
      id={`dashboard-service-${service.id}`}
      className="min-w-0 rounded-2xl bg-surface border border-line p-4 sm:p-5 transition-all shadow-2xs hover:border-taupe/40"
    >
      <div className="flex items-start gap-3">
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 transition-opacity active:opacity-80"
        >
          <span className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sunken text-ink-faint border border-line">
            {service.image_url ? (
              <Image src={getMediaUrl(service.image_url)} alt="" fill sizes="76px" className="object-cover" />
            ) : (
              <Scissors size={24} className="text-taupe" />
            )}
          </span>
          <span className="min-w-0 flex-1 space-y-1">
            <span className="mobile-h4 line-clamp-2 text-ink font-bold hover:text-taupe transition-colors">
              {service.name}
            </span>
            <span className="mobile-body-sm block text-ink-body font-normal">
              {Number.isFinite(base) && base > 0 ? (
                <>From <span className="font-semibold text-ink">{peso(base)}</span></>
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
              <span className="truncate">{(service as any).orders_count ?? service.job_orders_count ?? 0} sold</span>
              <span className="text-ink-faint">|</span>
              <span className="flex items-center gap-0.5 text-rose-600 shrink-0">
                <Heart size={10} className="fill-rose-500 text-rose-500 shrink-0" />
                <span>{service.saves_count ?? 0}</span>
              </span>
              <span className="text-ink-faint">|</span>
              <span className="flex items-center gap-1 truncate">
                <Clock size={11} className="text-taupe shrink-0" />
                {service.estimated_days ? 'Est. ' : ''}
                {formatServiceTurnaround(service.estimated_days ?? null, service.estimated_days_max ?? null)}
              </span>
            </div>
          </span>
        </Link>

        {canManage && (
          <span className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => (onEdit ? onEdit(service.id) : router.push(href))}
              aria-label={`Edit ${service.name}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-sunken hover:bg-canvas text-ink transition-colors cursor-pointer"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(service.id)}
              aria-label={`Delete ${service.name}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-sunken hover:bg-rose-50 text-danger transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </span>
        )}
      </div>

      <div className="mt-4 pt-3.5 border-t border-line">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="mobile-overline text-ink-faint font-bold tracking-wider">
            SERVICE DESIGNS{designs.length ? ` · ${designs.length}` : ''}
          </p>
          <div className="flex items-center gap-2">
            {canManage && (
              <Link
                href={`/dashboard/catalog/new?service_id=${service.id}`}
                className="flex items-center gap-1 text-xs font-semibold text-white bg-ink hover:bg-taupe px-3 py-1 rounded-full transition-colors"
              >
                <Plus size={13} /> Add Design
              </Link>
            )}
            <Link
              href={designsHref}
              className="flex items-center gap-0.5 text-xs font-semibold text-taupe hover:underline px-1 py-1"
            >
              See all <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {designs.length === 0 ? (
          <div className="py-5 px-4 bg-sunken/40 rounded-xl border border-dashed border-line text-center my-1">
            <p className="mobile-caption text-ink-muted mb-2 font-normal">
              No service designs created under this service yet.
            </p>
            {canManage && (
              <Link
                href={`/dashboard/catalog/new?service_id=${service.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-espresso hover:bg-espresso/90 px-3.5 py-1.5 rounded-full transition-colors"
              >
                <Plus size={14} /> Add First Design
              </Link>
            )}
          </div>
        ) : (
          <div className="hide-scrollbar flex snap-x gap-3 sm:gap-4 overflow-x-auto pb-2 pt-1">
            {designs.map((d: any) => {
              const itemResult: CatalogItemResult = {
                id: d.id,
                name: d.name,
                price: d.price ?? service.base_price,
                estimated_days: d.estimated_days ?? service.estimated_days ?? null,
                material: d.material ?? '',
                garment_type: d.garment_type ?? null,
                color: d.color ?? null,
                description: d.description ?? '',
                images: (d.images ?? []).map((img: any, idx: number) => ({
                  id: img.id ?? idx,
                  catalog_item_id: d.id,
                  image_url: img.image_url,
                  view_angle: img.view_angle ?? null,
                  is_primary: Boolean(img.is_primary ?? idx === 0),
                  sort_order: img.sort_order ?? idx,
                })),
                reviews_avg_rating: d.reviews_avg_rating != null ? Number(d.reviews_avg_rating) : null,
                reviews_count: d.reviews_count ?? 0,
                order_count: d.order_count ?? 0,
                saves_count: d.saves_count ?? 0,
                service_id: service.id,
                service_name: service.name,
                service: { id: service.id, name: service.name },
                pricing: d.pricing ?? null,
              };

              return (
                <div key={d.id} className="w-[175px] sm:w-[200px] shrink-0 snap-start flex">
                  <CatalogItemCard
                    item={itemResult}
                    canManage={canManage}
                    onDelete={onDeleteDesign}
                    hideLocation
                    hrefOverride={`/dashboard/catalog/${d.id}`}
                    isPaused={d.is_active === false}
                    reviewBadge={d.apparel_review ? 'In review' : undefined}
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
