'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';

interface RecentShop {
  type: 'shop';
  id: number;
  name: string;
  slug: string;
  logo_path: string | null;
  city: string | null;
}

interface RecentService {
  type: 'service';
  id: number;
  name: string;
  base_price: number | null;
  estimated_days: number | null;
  shop: { name: string; slug: string } | null;
}

type RecentCatalogItem = CatalogItemResult & { type: 'catalog_item' };
type RecentRow = RecentCatalogItem | RecentService | RecentShop;

type Tab = 'showroom' | 'services' | 'shops';
const TABS: { key: Tab; label: string; type: RecentRow['type'] }[] = [
  { key: 'showroom', label: 'Showroom', type: 'catalog_item' },
  { key: 'services', label: 'Services', type: 'service' },
  { key: 'shops', label: 'Shops', type: 'shop' },
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

      {rows === null && <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>}

      {rows !== null && filtered.length === 0 && <EmptyState />}

      {rows !== null && filtered.length > 0 && tab === 'showroom' && (
        <>
          <div className="grid grid-cols-2 gap-[5px]">
            {(filtered as RecentCatalogItem[]).map((item) => <CatalogItemCard key={item.id} item={item} />)}
          </div>
          <EndOfList />
        </>
      )}

      {rows !== null && filtered.length > 0 && tab === 'services' && (
        <>
          <div className="grid grid-cols-2 gap-[5px]">
            {(filtered as RecentService[]).map((service) => (
              <Link
                key={service.id}
                href={service.shop ? `/shop/${service.shop.slug}` : '/services'}
                className="bg-surface border border-line rounded-2xl overflow-hidden p-3"
              >
                <p className="text-xs font-semibold text-ink line-clamp-2 leading-snug min-h-[2rem]">{service.name}</p>
                {service.base_price !== null && (
                  <p className="text-sm font-bold text-taupe mt-1">₱{Number(service.base_price).toLocaleString()}</p>
                )}
                <p className="text-[11px] text-ink-faint mt-0.5 truncate">{service.shop?.name}</p>
              </Link>
            ))}
          </div>
          <EndOfList />
        </>
      )}

      {rows !== null && filtered.length > 0 && tab === 'shops' && (
        <>
          <div className="grid grid-cols-2 gap-[5px]">
            {(filtered as RecentShop[]).map((shop) => (
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
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-14">
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
