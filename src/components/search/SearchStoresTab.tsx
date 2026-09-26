'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Star, ChevronRight, MapPin } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { isStoreOpen } from '@/lib/storeStatus';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import { RelatedStore, SearchActiveTab } from './types';
import type { CatalogItemResult } from '@/types/publicCatalog';

// A store's carousel can source items from three shapes: the full search
// results list (already a complete CatalogItemResult with `store`/rating
// data), or the leaner `RelatedStore.catalog_items` embed (no `store`/rating
// fields). Normalizing both into a full CatalogItemResult lets the carousel
// render the exact same CatalogItemCard used by the Catalog Designs section
// below, instead of a hand-rolled card that silently drifts out of sync.
type LeanCatalogItem = NonNullable<RelatedStore['catalog_items']>[number];

function toCatalogItemResult(item: CatalogItemResult | LeanCatalogItem, store: RelatedStore): CatalogItemResult {
  const maybeFull = item as Partial<CatalogItemResult>;
  return {
    id: item.id,
    name: item.name,
    garment_type: item.garment_type ?? '',
    price: item.price != null ? Number(item.price) : null,
    material: item.material ?? null,
    color: maybeFull.color ?? null,
    estimated_days: maybeFull.estimated_days ?? null,
    reviews_count: maybeFull.reviews_count ?? 0,
    reviews_avg_rating: maybeFull.reviews_avg_rating ?? null,
    order_count: maybeFull.order_count ?? 0,
    images: (item.images ?? []).map((img) => ({
      image_url: img.image_url,
      is_primary: img.is_primary ?? false,
    })),
    fabric_image_url: item.fabric_image_url ?? null,
    // Always null here, even if the source item carries a real distance —
    // the store row above this carousel already shows "NEAREST · X km", so
    // repeating it as a badge on every one of that store's mini cards is
    // redundant clutter specific to this section.
    distance_km: null,
    store: maybeFull.store ?? { id: store.id, name: store.name, slug: store.slug },
  };
}

interface SearchStoresTabProps {
  readonly stores: RelatedStore[];
  readonly storesLoading: boolean;
  readonly activeTab: SearchActiveTab;
  readonly setActiveTab: (tab: SearchActiveTab) => void;
  readonly effectiveQ: string;
  readonly items: CatalogItemResult[];
  readonly total: number;
  readonly gate: (href: string) => string;
  readonly showFabric?: boolean;
  readonly setShowFabric?: React.Dispatch<React.SetStateAction<boolean>>;
  readonly userCoords?: { lat: number; lng: number } | null;
}

export default function SearchStoresTab({
  stores,
  storesLoading,
  activeTab,
  setActiveTab,
  effectiveQ,
  items,
  total,
  gate,
  showFabric = false,
  userCoords,
}: SearchStoresTabProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-bold text-ink">Nearby Stores</h2>
        <span className="text-xs text-ink-muted">
          {stores.length} {stores.length === 1 ? 'result' : 'results'}{userCoords ? ' · nearest first' : ''}
        </span>
      </div>

      {storesLoading ? (
        // Mirrors the real store row exactly: avatar + name block, then the
        // "Catalog designs" label and its mini-card carousel, so nothing
        // shifts size once the real rows swap in.
        <div className="divide-y divide-line border-t border-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b border-line border-x-0 rounded-none px-0 py-3.5 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-full bg-sunken shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-2.5 w-20 bg-sunken rounded" />
                    <div className="h-3.5 w-2/3 bg-sunken rounded" />
                    <div className="h-2.5 w-1/3 bg-sunken rounded" />
                    <div className="h-2.5 w-2/5 bg-sunken rounded" />
                  </div>
                </div>
              </div>
              <div className="h-3 w-32 bg-sunken rounded" />
              <div className="flex gap-2.5 py-1">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div
                    key={j}
                    className="w-[34%] min-w-[118px] max-w-[142px] sm:w-[140px] shrink-0 border border-line"
                  >
                    <div className="aspect-3/4 bg-sunken" />
                    <div className="px-1.5 pt-1.5 pb-2 space-y-1">
                      <div className="h-2.5 w-full bg-sunken rounded" />
                      <div className="h-2 w-2/3 bg-sunken rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-transparent border-y border-line border-x-0 rounded-none px-4 py-10 text-center">
          <Store size={28} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold text-ink">No Stores Found</p>
          <p className="mt-1 text-xs text-ink-muted">No tailoring stores matched your search. Try another query or location.</p>
        </div>
      ) : (
        <div className="divide-y divide-line border-t border-line">
          {(activeTab === 'all' ? stores.slice(0, 4) : stores).map((store, index) => {
            const distKm = store.distance_km != null ? store.distance_km : null;
            const branch = store.branches?.[0];
            const districtText = branch?.district || branch?.city || 'Davao City';
            const imageSrc = store.logo_path || store.banner_path;

            const itemsMatchingStore = items.filter(
              (i) => i.store?.id === store.id || (i as { store_id?: number }).store_id === store.id
            );
            const qLower = effectiveQ.trim().toLowerCase();
            const matchingCatalogItems = (store.catalog_items || []).filter((item) => {
              if (!qLower) return true;
              return (
                item.name?.toLowerCase().includes(qLower) ||
                item.garment_type?.toLowerCase().includes(qLower) ||
                item.material?.toLowerCase().includes(qLower)
              );
            });

            const storeCarouselItems =
              itemsMatchingStore.length > 0
                ? itemsMatchingStore
                : matchingCatalogItems.length > 0
                  ? matchingCatalogItems
                  : store.catalog_items ?? [];

            const matchedCount = effectiveQ.trim()
              ? store.matching_items_count ?? (itemsMatchingStore.length || matchingCatalogItems.length)
              : store.catalog_items?.length ?? storeCarouselItems.length;

            return (
              <div key={store.id} className="border-b border-line border-x-0 rounded-none px-0 py-3.5 space-y-2.5">
                {/* Store Header Row */}
                <Link
                  href={gate(
                    `/store/${store.slug}?tab=catalog${effectiveQ.trim() ? `&q=${encodeURIComponent(effectiveQ.trim())}` : ''}`
                  )}
                  className="flex items-center justify-between gap-3 group active:opacity-80"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-14 h-14 shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-sunken relative border border-line">
                        {imageSrc ? (
                          <Image
                            src={getMediaUrl(imageSrc)}
                            alt={store.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store size={22} className="text-ink-faint" />
                          </div>
                        )}
                      </div>
                      <span
                        aria-label={isStoreOpen(store.operating_hours) ? 'Open now' : 'Closed now'}
                        title={isStoreOpen(store.operating_hours) ? 'Open now' : 'Closed now'}
                        className={`absolute -bottom-0.5 -right-0.5 z-10 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                          isStoreOpen(store.operating_hours) ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {distKm != null ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                            {index === 0 ? `NEAREST · ${distKm.toFixed(1)} km` : `${distKm.toFixed(1)} km`}
                          </span>
                        ) : store.subscription_plan === 'premium' || store.is_featured ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                            ★ FEATURED STORE
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                            DAVAO CITY
                          </span>
                        )}
                        {store.reviews_avg_rating ? (
                          <span className="text-[10px] font-bold text-ink-muted flex items-center gap-0.5">
                            <Star size={10} className="fill-current text-taupe" />
                            {Number(store.reviews_avg_rating).toFixed(1)} ({store.reviews_count ?? 0})
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-[15px] font-bold text-ink truncate leading-tight group-hover:text-taupe transition-colors">
                        {store.name}
                      </h3>
                      <p className="text-[11px] text-ink-muted truncate">
                        {store.owner?.name ? `by ${store.owner.name}` : `by Tailoring Master`}
                      </p>
                      <p className="text-[11px] text-ink-faint truncate">
                        {districtText} · Davao City
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-ink-faint group-hover:text-ink transition-colors shrink-0" />
                </Link>

                {/* Carousel Header */}
                {storeCarouselItems.length > 0 && (
                  <div className="px-0.5 pt-0.5">
                    <span className="text-[11px] font-bold text-ink">
                      {effectiveQ.trim()
                        ? `${matchedCount} matching catalog design${matchedCount === 1 ? '' : 's'}`
                        : `Catalog designs (${matchedCount})`}
                    </span>
                  </div>
                )}

                {/* Carousel — same CatalogItemCard as the Catalog Designs section, just narrower */}
                {storeCarouselItems.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x snap-mandatory">
                    {storeCarouselItems.map((item) => (
                      <div
                        key={item.id}
                        className="snap-start w-[34%] min-w-[118px] max-w-[142px] sm:w-[140px] shrink-0"
                      >
                        <CatalogItemCard item={toCatalogItemResult(item, store)} showFabric={showFabric} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'store' && userCoords && stores.length > 0 && (
        <div className="mt-3 py-2.5 px-0 flex items-center gap-2.5 text-ink-muted text-xs border-b border-line/60">
          <MapPin size={14} className="text-taupe shrink-0" />
          <span>Distances are ordered from your current location in Davao City.</span>
        </div>
      )}

      {activeTab === 'store' && (total > 0 || items.length > 0) && (
        <p className="text-center mt-6 mb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('showroom');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-6 rounded-full border border-line bg-surface hover:bg-sunken text-xs font-bold text-ink hover:text-taupe transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <span>See all {effectiveQ ? `“${effectiveQ}” ` : ''}results ({total || items.length})</span>
            <ChevronRight size={14} />
          </button>
        </p>
      )}

      {activeTab === 'all' && stores.length > 4 && (
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className="w-full mt-3 py-2.5 rounded-xl border border-line bg-surface text-xs font-bold text-taupe hover:bg-sunken transition-colors cursor-pointer"
        >
          View all {stores.length} stores →
        </button>
      )}
    </div>
  );
}
