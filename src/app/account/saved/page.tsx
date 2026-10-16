'use client';

import { useEffect, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import SegmentedTabs from '@/components/account/SegmentedTabs';
import ServiceMiniCard from '@/components/account/ServiceMiniCard';

interface SavedService {
  id: number;
  name: string;
  description: string | null;
  base_price: string | number | null;
  estimated_days: number | null;
  estimated_days_max?: number | null;
  image_url: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  store: { id: number; name: string; slug: string } | null;
}

// Mirrors MyRatingsPage (same customer-scoped endpoints, same tab pattern): the heart on a Catalog item or Service page
// lands here.
type Tab = 'catalog' | 'services';
const TABS: { key: Tab; label: string; shortLabel: string }[] = [
  { key: 'catalog', label: 'Designs', shortLabel: 'Designs' },
  { key: 'services', label: 'Services', shortLabel: 'Services' },
];

const nothingSaved = <EmptyState Icon={Heart} title="Nothing saved yet" message="Tap the heart on a design or a service and it will be kept here." action={{ href: '/search', label: 'Go to Search' }} />;

export default function MySavedItemsPage() {
  const [tab, setTab] = useState<Tab>('catalog');
  const [items, setItems] = useState<CatalogItemResult[] | null>(null);
  const [services, setServices] = useState<SavedService[] | null>(null);

  useEffect(() => {
    api.get('/my-saved-catalog-items').then((res) => setItems(res.data.data ?? [])).catch(() => setItems([]));
    api.get('/my-saved-services').then((res) => setServices(res.data.data ?? [])).catch(() => setServices([]));
  }, []);

  const loading = (tab === 'catalog' && items === null) || (tab === 'services' && services === null);

  return (
    <div>
      <AccountHeader title="My Saved Items" backHref="/account" />
      <SegmentedTabs label="Saved items" options={TABS} active={tab} onChange={setTab} />

      {loading && <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>}

      {tab === 'catalog' && items !== null && (
        items.length === 0 ? nothingSaved : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,142px))] gap-[5px] sm:gap-3">
            {items.map((item) => <CatalogItemCard key={item.id} item={item} />)}
          </div>
        )
      )}

      {tab === 'services' && services !== null && (
        services.length === 0 ? nothingSaved : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {services.filter((s) => s.store).map((s) => (
              <ServiceMiniCard
                key={s.id}
                href={`/store/${s.store!.slug}/service/${s.id}`}
                name={s.name}
                imageUrl={s.image_url}
                eyebrow={s.store!.name}
                basePrice={s.base_price}
                estimatedDays={s.estimated_days}
                estimatedDaysMax={s.estimated_days_max}
                rating={s.reviews_avg_rating}
                reviewsCount={s.reviews_count ?? 0}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
