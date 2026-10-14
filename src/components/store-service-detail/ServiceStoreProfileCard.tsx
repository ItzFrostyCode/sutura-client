'use client';

import ShopMiniCard from '@/components/shared/ShopMiniCard';
import type { StoreProfile } from '@/components/store-storefront/types';

interface ServiceStoreProfileCardProps {
  store: StoreProfile;
  gate: (href: string) => string;
}

/** The shop this service belongs to, on one row (same card as the design page). */
export default function ServiceStoreProfileCard({ store, gate }: ServiceStoreProfileCardProps) {
  return <ShopMiniCard name={store.name} href={gate(`/store/${store.slug}`)} logoPath={store.logo_path} rating={store.reviews_avg_rating} reviewsCount={store.reviews_count ?? 0} />;
}
