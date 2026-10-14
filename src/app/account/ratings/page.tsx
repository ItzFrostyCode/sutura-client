'use client';

import { useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import SegmentedTabs from '@/components/account/SegmentedTabs';
import StoreCard from '@/components/stores/StoreCard';
import type { StoreResult } from '@/components/stores/storesTypes';

type RatedStore = StoreResult & { rating: number };

// No Services tab — rating a service isn't possible anywhere in the app yet (no ServiceReview model/endpoint), so a
// permanently-empty tab would be dead weight here. Recently Viewed's Services tab is real (backed by click-tracking).
type Tab = 'showroom' | 'stores';
const TABS: { key: Tab; label: string; shortLabel: string }[] = [
  { key: 'showroom', label: 'Catalog Designs', shortLabel: 'Catalog' },
  { key: 'stores', label: 'Stores', shortLabel: 'Stores' },
];

const nothingRated = <EmptyState Icon={Star} title="Nothing rated yet" message="Designs and stores you rate will be listed here." action={{ href: '/search', label: 'Go to Search' }} />;

export default function MyRatingsPage() {
  const [tab, setTab] = useState<Tab>('showroom');
  const [items, setItems] = useState<CatalogItemResult[] | null>(null);
  const [stores, setStores] = useState<RatedStore[] | null>(null);

  useEffect(() => {
    api.get('/my-catalog-reviews').then((res) => setItems(res.data.data ?? [])).catch(() => setItems([]));
    api.get('/my-store-reviews').then((res) => setStores(res.data.data ?? [])).catch(() => setStores([]));
  }, []);

  const loading = (tab === 'showroom' && items === null) || (tab === 'stores' && stores === null);

  return (
    <div>
      <AccountHeader title="My Ratings" backHref="/account" />
      <SegmentedTabs label="Ratings" options={TABS} active={tab} onChange={setTab} />

      {loading && <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>}

      {tab === 'showroom' && items !== null && (
        items.length === 0 ? nothingRated : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,142px))] gap-[5px] sm:gap-3">
            {items.map((item) => <CatalogItemCard key={item.id} item={item} />)}
          </div>
        )
      )}

      {tab === 'stores' && stores !== null && (
        stores.length === 0 ? nothingRated : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stores.map((store) => <StoreCard key={store.id} store={store} />)}
          </div>
        )
      )}
    </div>
  );
}
