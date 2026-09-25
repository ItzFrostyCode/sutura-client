'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Shirt, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';
import StoreCard from '@/components/stores/StoreCard';
import type { StoreResult } from '@/components/stores/storesTypes';

type RatedStore = StoreResult & { rating: number };

// No Services tab — rating a service isn't possible anywhere in the app
// yet (no ServiceReview model/endpoint exists), so a permanently-empty tab
// would just be dead weight here. Recently Viewed's Services tab is real
// (backed by click-tracking), which is why it keeps its three tabs.
type Tab = 'showroom' | 'stores';
const TABS: { key: Tab; label: string; shortLabel: string }[] = [
  { key: 'showroom', label: 'Catalog Designs', shortLabel: 'Catalog' },
  { key: 'stores', label: 'Stores', shortLabel: 'Stores' },
];

export default function MyRatingsPage() {
  const [tab, setTab] = useState<Tab>('showroom');
  const [items, setItems] = useState<CatalogItemResult[] | null>(null);
  const [stores, setStores] = useState<RatedStore[] | null>(null);

  useEffect(() => {
    api.get('/my-catalog-reviews').then((res) => setItems(res.data.data ?? [])).catch(() => setItems([]));
    api.get('/my-store-reviews').then((res) => setStores(res.data.data ?? [])).catch(() => setStores([]));
  }, []);

  const loading = (tab === 'showroom' && items === null) || (tab === 'stores' && stores === null);
  const showroomEmpty = items !== null && items.length === 0;
  const storesEmpty = stores !== null && stores.length === 0;

  return (
    <div>
      <AccountHeader title="My Ratings" backHref="/account" />

      <div className="flex items-center border-b border-line mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 py-[5px] text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-taupe text-taupe' : 'border-transparent text-ink-muted'
            }`}
          >
            <span className="sm:hidden">{t.shortLabel}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="min-h-[50vh] flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      )}

      {tab === 'showroom' && !loading && (
        showroomEmpty ? <EmptyState /> : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,142px))] gap-[5px] sm:gap-3">
              {items!.map((item) => <CatalogItemCard key={item.id} item={item} />)}
            </div>
            <EndOfList />
          </>
        )
      )}

      {tab === 'stores' && !loading && (
        storesEmpty ? <EmptyState /> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stores!.map((store) => <StoreCard key={store.id} store={store} />)}
            </div>
            <EndOfList />
          </>
        )
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border border-line p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-sunken flex items-center justify-center mb-4">
        <Shirt size={24} className="text-ink-faint" />
      </div>
      <p className="text-sm text-ink-muted mb-4">Nothing here yet.</p>
      <Link href="/search" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold transition-colors">
        <Search size={14} /> Go to Search
      </Link>
    </div>
  );
}

function EndOfList() {
  return <p className="text-xs text-ink-faint text-center mt-6">No more catalogs found</p>;
}
