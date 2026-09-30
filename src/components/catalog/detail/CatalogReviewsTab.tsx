'use client';

import React, { useMemo } from 'react';
import CatalogRatingsSection from '@/components/store-catalog-detail/CatalogRatingsSection';
import type { DetailedCatalogItem } from './detailTypes';
import { toStorefrontItem } from '../editable/catalogItemMappers';

// The customer's own ratings section, unchanged — same overview box, star
// filters, review list and pager — headed "Ratings (count)".
export default function CatalogReviewsTab({ item }: Readonly<{ item: DetailedCatalogItem }>) {
  const sf = useMemo(() => toStorefrontItem(item), [item]);
  return <CatalogRatingsSection item={sf} title={`Ratings (${item.reviews_count ?? 0})`} />;
}
