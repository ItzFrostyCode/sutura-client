'use client';

import ShopMiniCard from '@/components/shared/ShopMiniCard';
import type { CatalogItem } from './types';

interface CatalogStoreProfileCardProps {
  item: CatalogItem;
  gate: (href: string) => string;
}

/** The shop this design belongs to, on one row (same card as the service page). */
export default function CatalogStoreProfileCard({ item, gate }: CatalogStoreProfileCardProps) {
  if (!item.store) return null;
  return <ShopMiniCard name={item.store.name} href={gate(`/store/${item.store.slug}`)} logoPath={item.store.logo_path} rating={item.store.reviews_avg_rating} reviewsCount={item.store.reviews_count ?? 0} />;
}
