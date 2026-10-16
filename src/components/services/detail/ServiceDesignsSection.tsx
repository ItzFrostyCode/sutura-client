import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Shirt } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import type { CatalogItemResponse } from '@/components/catalog/catalogTypes';

/** How a design is priced against its service, in plain words (the same wording customers get). */
function priceNote(d: CatalogItemResponse): string {
  if (d.pricing_mode === 'extra' && d.extra_charge) return `Service price + ₱${Number(d.extra_charge).toLocaleString()}`;
  if (d.pricing_mode === 'quote') return 'Price on request';
  return 'Same price as the service';
}

interface ServiceDesignsSectionProps {
  readonly storeId: number;
  readonly serviceId: number;
  readonly canManage: boolean;
}

/** The designs filed under this service. Designs are managed here now, not in a separate menu. */
export default function ServiceDesignsSection({ storeId, serviceId, canManage }: ServiceDesignsSectionProps) {
  const [designs, setDesigns] = useState<CatalogItemResponse[] | null>(null);

  useEffect(() => {
    api.get(`/stores/${storeId}/catalog`)
      .then((res) => {
        const list = (res.data?.data ?? []) as CatalogItemResponse[];
        setDesigns(list.filter((d) => d.service_id === serviceId));
      })
      .catch(() => setDesigns([]));
  }, [storeId, serviceId]);

  return (
    <section aria-label="Designs" className="border-y border-line bg-surface p-4 min-[600px]:border min-[600px]:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="mobile-h3 text-ink">Designs</h2>
          <p className="mobile-body-sm font-normal text-ink-muted">Examples of this service that customers can look at. A design is priced like its service.</p>
        </div>
        {canManage && (
          <Link href={`/dashboard/catalog/new?service_id=${serviceId}`} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white">
            <Plus size={16} /> Add a design
          </Link>
        )}
      </div>

      {designs === null && <p className="mobile-body-sm mt-4 font-normal text-ink-muted">Loading…</p>}
      {designs?.length === 0 && <p className="mobile-body-sm mt-4 font-normal text-ink-muted">No designs under this service yet.</p>}

      {designs && designs.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 min-[600px]:grid-cols-3 md:grid-cols-4">
          {designs.map((d) => {
            const photo = d.images?.find((i) => i.is_primary)?.image_url ?? d.images?.[0]?.image_url;
            return (
              <li key={d.id}>
                <Link href={`/dashboard/catalog/${d.id}`} className="block">
                  <span className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-sunken">
                    {photo ? <Image src={getMediaUrl(photo)} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" /> : <Shirt size={28} className="text-ink-faint" />}
                  </span>
                  <span className="mobile-body-sm mt-1.5 block truncate font-semibold text-ink">{d.name}</span>
                  <span className="mobile-caption block text-ink-muted">
                    {d.apparel_review ? 'Hidden until approved' : d.is_active === false ? 'Paused' : priceNote(d)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
