'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Store, Shirt } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';

interface RatedShop {
  rating: number;
  id: number;
  name: string;
  slug: string;
  logo_path: string | null;
  city: string | null;
}

// No Services tab — rating a service isn't possible anywhere in the app
// yet (no ServiceReview model/endpoint exists), so a permanently-empty tab
// would just be dead weight here. Recently Viewed's Services tab is real
// (backed by click-tracking), which is why it keeps its three tabs.
type Tab = 'showroom' | 'shops';
const TABS: { key: Tab; label: string }[] = [
  { key: 'showroom', label: 'Showroom' },
  { key: 'shops', label: 'Shops' },
];

export default function MyRatingsPage() {
  const [tab, setTab] = useState<Tab>('showroom');
  const [items, setItems] = useState<CatalogItemResult[] | null>(null);
  const [shops, setShops] = useState<RatedShop[] | null>(null);

  useEffect(() => {
    api.get('/my-catalog-reviews').then((res) => setItems(res.data.data ?? [])).catch(() => setItems([]));
    api.get('/my-shop-reviews').then((res) => setShops(res.data.data ?? [])).catch(() => setShops([]));
  }, []);

  const loading = (tab === 'showroom' && items === null) || (tab === 'shops' && shops === null);
  const showroomEmpty = items !== null && items.length === 0;
  const shopsEmpty = shops !== null && shops.length === 0;

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
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>}

      {tab === 'showroom' && !loading && (
        showroomEmpty ? <EmptyState /> : (
          <>
            <div className="grid grid-cols-2 gap-[5px]">
              {items!.map((item) => <CatalogItemCard key={item.id} item={item} />)}
            </div>
            <EndOfList />
          </>
        )
      )}

      {tab === 'shops' && !loading && (
        shopsEmpty ? <EmptyState /> : (
          <>
            <div className="grid grid-cols-2 gap-[5px]">
              {shops!.map((shop) => (
                <Link key={shop.id} href={`/shop/${shop.slug}`} className="bg-surface border border-line rounded-2xl p-3 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-sunken overflow-hidden relative mb-2">
                    {shop.logo_path ? (
                      <Image src={getMediaUrl(shop.logo_path)} alt="" fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Store size={18} className="text-ink-faint" /></div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-ink truncate w-full">{shop.name}</p>
                  {shop.city && <p className="text-[11px] text-ink-faint truncate w-full">{shop.city}</p>}
                </Link>
              ))}
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
    <div className="bg-surface border border-line rounded-2xl p-10 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-sunken flex items-center justify-center mb-4">
        <Shirt size={24} className="text-ink-faint" />
      </div>
      <p className="text-sm text-ink-muted mb-4">Nothing here yet.</p>
      <Link href="/search" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg transition-colors">
        <Search size={14} /> Go to Search
      </Link>
    </div>
  );
}

function EndOfList() {
  return <p className="text-xs text-ink-faint text-center mt-6">No more catalogs found</p>;
}
