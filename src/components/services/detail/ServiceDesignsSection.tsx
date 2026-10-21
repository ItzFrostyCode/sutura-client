import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import type { CatalogItemResponse } from '@/components/catalog/catalogTypes';

import { useToast } from '@/context/ToastContext';

interface ServiceDesignsSectionProps {
  readonly storeId: number;
  readonly serviceId: number;
  readonly canManage: boolean;
}

/** The designs filed under this service. Uniform card UI with all metrics. */
export default function ServiceDesignsSection({ storeId, serviceId, canManage }: ServiceDesignsSectionProps) {
  const toast = useToast();
  const [designs, setDesigns] = useState<CatalogItemResponse[] | null>(null);

  useEffect(() => {
    api.get(`/stores/${storeId}/catalog`)
      .then((res) => {
        const list = (res.data?.data ?? []) as CatalogItemResponse[];
        setDesigns(list.filter((d) => d.service_id === serviceId));
      })
      .catch(() => setDesigns([]));
  }, [storeId, serviceId]);

  const handleDeleteDesign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service design?')) return;
    try {
      await api.delete(`/stores/${storeId}/catalog/${id}`);
      toast.success('Service design deleted.');
      setDesigns((prev) => (prev ? prev.filter((d) => d.id !== id) : []));
    } catch {
      toast.error('Failed to delete service design.');
    }
  };

  return (
    <section aria-label="Service Designs" className="border-y border-line bg-surface p-4 min-[600px]:border min-[600px]:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mobile-h3 text-ink font-bold">Service Designs</h2>
          <p className="mobile-body-sm font-normal text-ink-muted">All visual garment designs created and offered under this service.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/catalog/new?service_id=${serviceId}`}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-taupe transition-colors cursor-pointer"
            >
              <Plus size={16} /> Add Service Design
            </Link>
          </div>
        )}
      </div>

      {designs === null && <p className="mobile-body-sm mt-4 font-normal text-ink-muted">Loading…</p>}
      {designs?.length === 0 && <p className="mobile-body-sm mt-4 font-normal text-ink-muted">No service designs under this service yet.</p>}

      {designs && designs.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {designs.map((d) => {
            const itemResult: CatalogItemResult = {
              id: d.id,
              name: d.name,
              price: d.price,
              estimated_days: d.estimated_days ?? null,
              material: d.material ?? '',
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
              reviews_avg_rating: (d as any).reviews_avg_rating ?? null,
              reviews_count: (d as any).reviews_count ?? 0,
              order_count: (d as any).order_count ?? 0,
              saves_count: (d as any).saves_count ?? 0,
              service_id: serviceId,
              pricing: (d as any).pricing ?? null,
            };

            return (
              <CatalogItemCard
                key={d.id}
                item={itemResult}
                canManage={canManage}
                onDelete={handleDeleteDesign}
                hideLocation
                hrefOverride={`/dashboard/catalog/${d.id}`}
                isPaused={d.is_active === false}
                reviewBadge={d.apparel_review ? 'In review' : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
