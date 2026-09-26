'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Scissors, Star, Clock, Loader2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/axios';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';
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
  reviews_count: number;
  reviews_avg_rating: number | null;
  store: { name: string; slug: string } | null;
}

type RecentCatalogItem = CatalogItemResult & { type: 'catalog_item' };
type RecentRow = RecentCatalogItem | RecentService | RecentStore;

type Tab = 'showroom' | 'services' | 'stores';
const TABS: { key: Tab; label: string; shortLabel: string; type: RecentRow['type'] }[] = [
  { key: 'showroom', label: 'Catalog Designs', shortLabel: 'Catalog', type: 'catalog_item' },
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

      {rows === null && (
        <div className="min-h-[50vh] flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      )}

      {rows !== null && filtered.length === 0 && <EmptyState />}

      {rows !== null && filtered.length > 0 && tab === 'showroom' && (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,142px))] gap-[5px] sm:gap-3">
            {(filtered as RecentCatalogItem[]).map((item) => <CatalogItemCard key={item.id} item={item} />)}
          </div>
          <EndOfList />
        </>
      )}

      {rows !== null && filtered.length > 0 && tab === 'services' && (
        <>
          {/* Same card as the store profile's own Services tab / /search's
              cross-store services list — image, rating, category, name,
              price, est. days. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(filtered as RecentService[]).map((service) => {
              const priceDisplay =
                service.base_price !== null && service.base_price !== undefined
                  ? `₱${Number(service.base_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}`
                  : 'Custom Quote';
              const serviceHref = service.store
                ? `/store/${service.store.slug}/service/${service.id}`
                : '/search?tab=services';

              return (
                <Link
                  key={service.id}
                  href={serviceHref}
                  className="bg-surface border border-line hover:border-taupe transition-all duration-300 flex flex-col justify-between overflow-hidden group active:scale-[0.98]"
                >
                  <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
                    {service.image_url ? (
                      <Image
                        src={getMediaUrl(service.image_url)}
                        alt={service.name}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-faint">
                        <Scissors size={24} className="text-taupe/40" />
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      {service.reviews_avg_rating && service.reviews_avg_rating > 0 ? (
                        <div className="flex items-center gap-1 mb-1 h-3.5">
                          <Star size={10} className="fill-amber-400 text-amber-500 shrink-0" />
                          <span className="text-[10px] font-semibold text-ink">
                            {service.reviews_avg_rating.toFixed(1)}
                          </span>
                          {service.reviews_count > 0 && (
                            <span className="text-[10px] text-ink-faint">({service.reviews_count})</span>
                          )}
                        </div>
                      ) : null}
                      <span className="text-[9px] font-medium uppercase tracking-wide text-taupe truncate block">
                        {service.category || 'Tailoring Service'}
                      </span>
                      <h4 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-0.5 line-clamp-2">
                        {service.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-line/50 mt-2">
                      <span className="text-xs font-bold text-ink truncate">{priceDisplay}</span>
                      <span className="flex items-center gap-1 text-[10px] text-ink-muted font-medium shrink-0 ml-1">
                        <Clock size={10} className="text-taupe shrink-0" />
                        <span>Est. {service.estimated_days ? `${service.estimated_days}d` : '7-10d'}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <EndOfList />
        </>
      )}

      {rows !== null && filtered.length > 0 && tab === 'stores' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(filtered as RecentStore[]).map((store) => <StoreCard key={store.id} store={store} />)}
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
      <Link href="/search" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold transition-colors">
        <Search size={14} /> Go to Search
      </Link>
    </div>
  );
}

function EndOfList() {
  return <p className="text-xs text-ink-faint text-center mt-6">No more catalogs found</p>;
}
