'use client';

import React, { useMemo } from 'react';
import CatalogRatingsSection from '@/components/store-catalog-detail/CatalogRatingsSection';
import type { CatalogItem } from '@/components/store-catalog-detail/types';
import { PublicService } from '@/components/store-storefront/types';

// The Catalog Design's own ratings section (overview box, star filters,
// list, pager), fed with this service's ratings. Services take star ratings
// only, so there are no comments to show. Rating itself is done from the bar
// under the photo, exactly like the design page.
export default function ServiceRatingsSection({ service }: Readonly<{ service: PublicService }>) {
  const item = useMemo(
    () =>
      ({
        id: service.id,
        name: service.name,
        price: 0,
        images: [],
        reviews_avg_rating: service.reviews_avg_rating ?? 0,
        reviews_count: service.reviews_count ?? 0,
        reviews: (service.reviews ?? []).map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: null,
          created_at: r.created_at,
          user: r.user ? { name: r.user.name } : null,
        })),
      }) as unknown as CatalogItem,
    [service]
  );

  return <CatalogRatingsSection item={item} title={`Service Ratings (${service.reviews_count ?? 0})`} />;
}
