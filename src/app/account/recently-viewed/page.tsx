'use client';

import { useEffect, useMemo, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import SegmentedTabs from '@/components/account/SegmentedTabs';
import ServiceMiniCard from '@/components/account/ServiceMiniCard';
import StoreCard from '@/components/stores/StoreCard';
import type { StoreResult } from '@/components/stores/storesTypes';

type RecentStore = StoreResult & { type: 'store' };

interface RecentService {
  type: 'service';
  id: number;
  name: string;
  category: string | null;
  image_url: string | null;
  base_price: number | null;
  estimated_days: number | null;
  estimated_days_max?: number | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  store: { name: string; slug: string } | null;
}

type RecentCatalogItem = CatalogItemResult & { type: 'catalog_item' };
type RecentRow = RecentCatalogItem | RecentService | RecentStore;

type Tab = 'showroom' | 'services' | 'stores';
const TABS: { key: Tab; label: string; shortLabel: string; type: RecentRow['type'] }[] = [
  { key: 'showroom', label: 'Designs', shortLabel: 'Designs', type: 'catalog_item' },
  { key: 'services', label: 'Services', shortLabel: 'Services', type: 'service' },
  { key: 'stores', label: 'Stores', shortLabel: 'Stores', type: 'store' },
];

export default function RecentlyViewedPage() {
  const [tab, setTab] = useState<Tab>('showroom');
  const [rows, setRows] = useState<RecentRow[] | null>(null);

  useEffect(() => {
    api.get('/my-recently-viewed').then((res) => setRows(res.data.data ?? [])).catch(() => setRows([]));
  }, []);

  const activeType = TABS.find((t) => t.key === tab)!.type;
  const filtered = useMemo(() => (rows ?? []).filter((r) => r.type === activeType), [rows, activeType]);

  return (
    <div>
      <AccountHeader title="Recently Viewed" backHref="/account" />
      <SegmentedTabs label="Recently viewed" options={TABS} active={tab} onChange={setTab} />

      {rows === null && <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>}

      {rows !== null && filtered.length === 0 && (
        <EmptyState Icon={History} title="Nothing here yet" message="What you look at will be remembered here." action={{ href: '/search', label: 'Go to Search' }} />
      )}

      {rows !== null && filtered.length > 0 && tab === 'showroom' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,142px))] gap-[5px] sm:gap-3">
          {(filtered as RecentCatalogItem[]).map((item) => <CatalogItemCard key={item.id} item={item} />)}
        </div>
      )}

      {rows !== null && filtered.length > 0 && tab === 'services' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(filtered as RecentService[]).map((service) => (
            <ServiceMiniCard
              key={service.id}
              href={service.store ? `/store/${service.store.slug}/service/${service.id}` : '/search?tab=services'}
              name={service.name}
              imageUrl={service.image_url}
              eyebrow={service.category || 'Tailoring Service'}
              basePrice={service.base_price}
              estimatedDays={service.estimated_days}
              estimatedDaysMax={service.estimated_days_max}
              rating={service.reviews_avg_rating}
              reviewsCount={service.reviews_count}
            />
          ))}
        </div>
      )}

      {rows !== null && filtered.length > 0 && tab === 'stores' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(filtered as RecentStore[]).map((store) => <StoreCard key={store.id} store={store} />)}
        </div>
      )}
    </div>
  );
}
