'use client';

import { useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import SegmentedTabs from '@/components/account/SegmentedTabs';
import AccountServiceGrid, { type AccountService } from '@/components/account/AccountServiceGrid';
import StoreCard from '@/components/stores/StoreCard';
import type { StoreResult } from '@/components/stores/storesTypes';

type RatedStore = StoreResult & { rating: number };

// Same three tabs, in the same order, as My Saved and Recently Viewed: Shops · Services · Designs.
// Services are rated with stars on a service's page (ServiceReview).
type Tab = 'stores' | 'services' | 'showroom';
const TABS: { key: Tab; label: string; shortLabel: string }[] = [
  { key: 'stores', label: 'Shops', shortLabel: 'Shops' },
  { key: 'services', label: 'Services', shortLabel: 'Services' },
  { key: 'showroom', label: 'Designs', shortLabel: 'Designs' },
];

const nothingRated = <EmptyState Icon={Star} title="Nothing rated yet" message="Shops, services and designs you rate will be listed here." action={{ href: '/search', label: 'Find a Shop' }} />;

export default function MyRatingsPage() {
  const [tab, setTab] = useState<Tab>('stores');
  const [stores, setStores] = useState<RatedStore[] | null>(null);
  const [services, setServices] = useState<AccountService[] | null>(null);
  const [items, setItems] = useState<CatalogItemResult[] | null>(null);

  useEffect(() => {
    api.get('/my-store-reviews').then((res) => setStores(res.data.data ?? [])).catch(() => setStores([]));
    api.get('/my-service-reviews').then((res) => setServices(res.data.data ?? [])).catch(() => setServices([]));
    api.get('/my-catalog-reviews').then((res) => setItems(res.data.data ?? [])).catch(() => setItems([]));
  }, []);

  const current = { stores, services, showroom: items }[tab];

  return (
    <div>
      <AccountHeader title="My Ratings" backHref="/account" />
      <SegmentedTabs label="Ratings" options={TABS} active={tab} onChange={setTab} />

      {current === null && <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>}
      {current !== null && current.length === 0 && nothingRated}

      {tab === 'stores' && stores && stores.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stores.map((store) => <StoreCard key={store.id} store={store} />)}
        </div>
      )}
      {tab === 'services' && services && services.length > 0 && <AccountServiceGrid services={services} />}
      {tab === 'showroom' && items && items.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,142px))] gap-[5px] sm:gap-3">
          {items.map((item) => <CatalogItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
