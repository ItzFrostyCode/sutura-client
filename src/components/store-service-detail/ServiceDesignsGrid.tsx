'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { embedSuffix } from '@/hooks/useEmbedded';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { CatalogListItem, StoreProfile } from '@/components/store-storefront/types';

interface ServiceDesignsGridProps {
  readonly storeId: string;
  readonly serviceId: number;
  /** Inside the map panel: links keep ?embed=1. */
  readonly embedded?: boolean;
  readonly store?: StoreProfile | null;
}

/**
 * Designs made under this service rendered as full catalog cards consistent with
 * "From the Same Shop", Search results, and Catalog Showroom.
 */
export default function ServiceDesignsGrid({ storeId, serviceId, embedded = false, store }: ServiceDesignsGridProps) {
  const [designs, setDesigns] = useState<CatalogListItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    api.get(`/catalog/${storeId}`)
      .then((res) => {
        const list: CatalogListItem[] = res.data.data ?? [];
        if (alive) setDesigns(list.filter((d) => d.service_id === serviceId));
      })
      .catch(() => alive && setDesigns([]));
    return () => { alive = false; };
  }, [storeId, serviceId]);

  if (designs === null) return null;

  return (
    <section aria-labelledby="service-designs-title">
      <h2 id="service-designs-title" className="mobile-h3 text-ink">Designs for this service</h2>
      <p className="mobile-caption mb-3 text-ink-muted">
        {designs.length === 0
          ? 'No designs yet — book the service and the shop will design it with you.'
          : `${designs.length} design${designs.length === 1 ? '' : 's'} made under this service. Tap one for its sizes, fabric and photos.`}
      </p>
      {designs.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 min-[600px]:grid-cols-3 lg:grid-cols-4">
          {designs.map((d) => {
            const itemResult: CatalogItemResult = {
              id: d.id,
              name: d.name,
              garment_type: d.garment_type ?? '',
              price: d.price ? Number(d.price) : null,
              pricing: (d as any).pricing ?? null,
              material: d.material ?? null,
              color: d.color ?? null,
              estimated_days: d.estimated_days ?? null,
              reviews_count: d.reviews_count ?? 0,
              reviews_avg_rating: d.reviews_avg_rating !== undefined ? d.reviews_avg_rating : null,
              order_count: (d as any).catalog_orders_count !== undefined
                ? ((d as any).catalog_orders_count ?? 0) + ((d as any).job_orders_count ?? 0)
                : ((d as any).order_count ?? 0),
              images: (d.images ?? []).map((img) => ({
                image_url: img.image_url,
                is_primary: Boolean(img.is_primary),
              })),
              fabric_image_url: d.fabric_image_url ?? null,
              store: store
                ? {
                    id: store.id,
                    name: store.name,
                    slug: store.slug,
                    branches: store.branches,
                  }
                : (d as any).store ?? null,
            };

            return (
              <CatalogItemCard
                key={d.id}
                item={itemResult}
                hrefOverride={`/store/${storeId}/catalog/${d.id}${embedSuffix(embedded)}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
