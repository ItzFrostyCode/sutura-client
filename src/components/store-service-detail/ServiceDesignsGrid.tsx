'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { embedSuffix } from '@/hooks/useEmbedded';
import DesignTile from '@/components/store-storefront/services/DesignTile';
import type { CatalogListItem } from '@/components/store-storefront/types';

interface ServiceDesignsGridProps {
  readonly storeId: string;
  readonly serviceId: number;
  /** Inside the map panel: links keep ?embed=1. */
  readonly embedded?: boolean;
}

/**
 * Every design the shop made under this service, two columns on a phone (three from 600px, four from 1024px), pictures and names
 * only — the price and booking are the service's, above. Tapping one opens the design's own page.
 */
export default function ServiceDesignsGrid({ storeId, serviceId, embedded = false }: ServiceDesignsGridProps) {
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
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 min-[600px]:grid-cols-3 lg:grid-cols-4">
          {designs.map((d) => <DesignTile key={d.id} item={d} href={`/store/${storeId}/catalog/${d.id}${embedSuffix(embedded)}`} />)}
        </div>
      )}
    </section>
  );
}
