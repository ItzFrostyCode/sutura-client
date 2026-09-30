'use client';

import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Heart, Loader2, Star, Clock, Scissors } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import AccountHeader from '@/components/account/AccountHeader';

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

// Mirrors MyRatingsPage exactly (same customer-scoped, no-role-gate
// endpoints, same tab pattern) — the heart/save button existed on both the
// Catalog item and Service detail pages, but had nowhere for the customer
// to actually see their saved list until this page.
type Tab = 'catalog' | 'services';
const TABS: { key: Tab; label: string; shortLabel: string }[] = [
  { key: 'catalog', label: 'Catalog Designs', shortLabel: 'Catalog' },
  { key: 'services', label: 'Services', shortLabel: 'Services' },
];

export default function MySavedItemsPage() {
  const [tab, setTab] = useState<Tab>('catalog');
  const [items, setItems] = useState<CatalogItemResult[] | null>(null);
  const [services, setServices] = useState<SavedService[] | null>(null);

  useEffect(() => {
    api.get('/my-saved-catalog-items').then((res) => setItems(res.data.data ?? [])).catch(() => setItems([]));
    api.get('/my-saved-services').then((res) => setServices(res.data.data ?? [])).catch(() => setServices([]));
  }, []);

  const loading = (tab === 'catalog' && items === null) || (tab === 'services' && services === null);
  const catalogEmpty = items !== null && items.length === 0;
  const servicesEmpty = services !== null && services.length === 0;

  return (
    <div>
      <AccountHeader title="My Saved Items" backHref="/account" />

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

      {tab === 'catalog' && !loading && (
        catalogEmpty ? <EmptyState /> : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,142px))] gap-[5px] sm:gap-3">
              {items!.map((item) => <CatalogItemCard key={item.id} item={item} />)}
            </div>
            <EndOfList />
          </>
        )
      )}

      {tab === 'services' && !loading && (
        servicesEmpty ? <EmptyState /> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {services!.map((service) => <SavedServiceCard key={service.id} service={service} />)}
            </div>
            <EndOfList />
          </>
        )
      )}
    </div>
  );
}

function SavedServiceCard({ service }: Readonly<{ service: SavedService }>) {
  const priceDisplay = service.base_price !== null && service.base_price !== undefined
    ? `₱${Number(service.base_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}`
    : 'Custom Quote';

  if (!service.store) return null;

  return (
    <Link
      href={`/store/${service.store.slug}/service/${service.id}`}
      className="bg-surface border border-line hover:border-taupe transition-all duration-300 flex flex-col overflow-hidden group"
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
          {service.reviews_avg_rating && Number(service.reviews_avg_rating) > 0 ? (
            <div className="flex items-center gap-1 mb-1 h-3.5">
              <Star size={10} className="fill-amber-400 text-amber-500 shrink-0" />
              <span className="text-[10px] font-semibold text-ink">{Number(service.reviews_avg_rating).toFixed(1)}</span>
              {(service.reviews_count ?? 0) > 0 && <span className="text-[10px] text-ink-faint">({service.reviews_count})</span>}
            </div>
          ) : null}
          <span className="text-[9px] font-medium uppercase tracking-wide text-taupe truncate block">{service.store.name}</span>
          <h4 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-0.5 line-clamp-2">{service.name}</h4>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-line/50 mt-2">
          <span className="text-xs font-bold text-ink truncate">{priceDisplay}</span>
          <span className="flex items-center gap-1 text-[10px] text-ink-muted font-medium shrink-0 ml-1">
            <Clock size={10} className="text-taupe shrink-0" />
            <span>{service.estimated_days ? 'Est. ' : ''}{formatServiceTurnaround(service.estimated_days, service.estimated_days_max)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border border-line p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-sunken flex items-center justify-center mb-4">
        <Heart size={24} className="text-ink-faint" />
      </div>
      <p className="text-sm text-ink-muted mb-4">Nothing saved yet.</p>
      <Link href="/search" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold transition-colors">
        <Search size={14} /> Go to Search
      </Link>
    </div>
  );
}

function EndOfList() {
  return <p className="text-xs text-ink-faint text-center mt-6">No more items found</p>;
}
