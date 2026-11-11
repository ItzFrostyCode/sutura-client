'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Store, ChevronRight, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import StoreRowInfo from './StoreRowInfo';
import SearchNoResults from './SearchNoResults';
import DragScrollRow from '@/components/shared/DragScrollRow';
import SearchServiceCard from './SearchServiceCard';
import { RelatedStore, SearchActiveTab } from './types';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { addRecentItem } from '@/lib/recentSearches';

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
    pricing: item.pricing ?? null,
    material: item.material ?? null,
    color: maybeFull.color ?? null,
    estimated_days: maybeFull.estimated_days ?? null,
    reviews_count: maybeFull.reviews_count ?? 0,
    reviews_avg_rating: maybeFull.reviews_avg_rating ?? null,
    order_count: (item as { order_count?: number }).order_count ?? maybeFull.order_count ?? 0,
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
    store: maybeFull.store ?? {
      id: store.id,
      name: store.name,
      slug: store.slug,
      branches: store.branches,
    },
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
  readonly userCoords?: { lat: number; lng: number } | null;
  readonly department?: string;
  /** In the map panel: tapping a shop opens its profile there (false when it has no pin) and its designs / services drop down. */
  /** Opens the shop inside the map panel; `path` (e.g. "/service/3") opens one of its pages there. False when it has no pin. */
  readonly onShowOnMap?: (slug: string, path?: string) => boolean;
  readonly inPanel?: boolean;
  /** The district the list is narrowed to ('' = none): names the heading and the empty state. */
  readonly district?: string;
  /** Clears the district (the empty state's "Show all Davao"). */
  readonly onShowAllDavao?: () => void;
  /** Search for another word (the empty state's correction / suggestions). */
  readonly onSuggest?: (term: string) => void;
  /** Clear the words and the district (the empty state's "See every shop"). */
  readonly onShowEverything?: () => void;
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
  userCoords,
  department = '',
  onShowOnMap,
  inPanel = false,
  district = '',
  onSuggest,
  onShowEverything,
}: SearchStoresTabProps) {
  const searchWord = effectiveQ.trim();
  const sw = searchWord.toLowerCase();

  /** Why a shop is in the results of a search: the services or designs that match (nothing extra when its name does). */
  function whyMatched(st: RelatedStore, ids: number[], designMatch: boolean): string | null {
    if (!searchWord) return null;
    const offered = (st.services ?? []).filter((svc) => ids.includes(svc.id));
    if (offered.length > 0) return `Offers: ${offered.slice(0, 2).map((x) => x.name).join( )}${offered.length > 2 ? ` +${offered.length - 2} more` : ''}`;
    if (st.name.toLowerCase().includes(sw)) return null;
    if (designMatch) return `Has designs matching “${searchWord}”`;
    return null;
  }

  // Shops whose designs / services are dropped down (only used in the map panel; elsewhere they are always shown).
  const [openIds, setOpenIds] = useState<number[]>([]);

  return (
    <div className="mb-6">
      {/* Says what the list is: the district chosen, or the shops near the person. */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
        <h2 className="mobile-h3 text-ink">
          {/* After a search the heading says what was searched; "Shops near you" is only for browsing. */}
          {searchWord ? `Results for “${searchWord}”${district ? ` in ${district}` : ''}` : district ? `Shops in ${district}` : 'Shops near you'}
        </h2>
        <span className="mobile-body-sm text-ink-muted">
          {stores.length} {stores.length === 1 ? 'shop' : 'shops'}{userCoords ? ' · nearest first' : ''}
        </span>
      </div>

      {storesLoading ? (
        // Mirrors the real row (StoreRowInfo): 56px logo, then distance, a two-line name, open / rating and the
        // address, and the ⌄ button on the right. In the map panel the rows start collapsed (no carousel), so the
        // placeholder has none either; elsewhere the carousel shows, so its placeholder does too.
        <div className="divide-y divide-line border-t border-line" role="status" aria-label="Loading shops">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2.5 py-3.5 motion-safe:animate-pulse" aria-hidden>
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <div className="h-14 w-14 shrink-0 rounded-full bg-sunken" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded bg-sunken" />
                    <div className="h-4 w-3/4 rounded bg-sunken" />
                    <div className="h-3 w-1/3 rounded bg-sunken" />
                    <div className="h-3 w-2/3 rounded bg-sunken" />
                  </div>
                </div>
                {inPanel && <div className="h-11 w-11 shrink-0 rounded-full bg-sunken" />}
              </div>
              {!inPanel && (
                <div className="flex gap-3 overflow-hidden py-1">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div key={j} className="w-[160px] shrink-0 border border-line">
                      <div className="aspect-3/4 bg-sunken" />
                      <div className="space-y-1.5 px-2 pb-2.5 pt-2">
                        <div className="h-3 w-full rounded bg-sunken" />
                        <div className="h-3 w-1/2 rounded bg-sunken" />
                        <div className="h-3 w-2/3 rounded bg-sunken" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        // Never a dead end: what was not found, the garment tiles to browse, and (under a line) the nearby shops.
        <SearchNoResults query={effectiveQ} what="shops" district={district} onSearch={(term) => onSuggest?.(term)} userCoords={userCoords} />
      ) : (
        <div className="divide-y divide-line border-t border-line">
          {(activeTab === 'all' ? stores.slice(0, 4) : stores).map((store, index) => {
            const distKm = store.distance_km != null ? store.distance_km : null;
            const branch = store.branches?.[0];
            const addressText = branch?.address || branch?.city || 'Davao City';
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

            // store.catalog_items is capped (take(10) server-side, for the
            // preview carousel) — its .length silently undercounts once a
            // store has more than 10 active designs. store.catalog_items_count
            // is a real, uncapped count from the backend and must win
            // whenever it's present; the .length fallbacks only cover a
            // stale response that predates this field.
            const matchedCount = effectiveQ.trim()
              ? store.matching_items_count ?? (itemsMatchingStore.length || matchingCatalogItems.length)
              : store.catalog_items_count ?? store.catalog_items?.length ?? storeCarouselItems.length;

            const isServicesFilter = department?.toLowerCase() === 'services' || department?.toLowerCase() === 'service';
            // With a search, only the services it is about (the server says which); a shop that matched on its name
            // or place has none, so all of its services show.
            const matchIds = qLower ? store.matching_service_ids ?? [] : [];
            const matchNote = whyMatched(store, matchIds, matchingCatalogItems.length > 0);
            // Matching services FIRST, the rest after — never hidden (shop owners: a "barong" search must not make the
            // shop look like it only does barong).
            const storeServices = matchIds.length > 0
              ? [...(store.services ?? []).filter((svc) => matchIds.includes(svc.id)), ...(store.services ?? []).filter((svc) => !matchIds.includes(svc.id))]
              : store.services ?? [];
            // Unlike catalog_items, the services relation isn't capped
            // server-side, so storeServices.length is only wrong when a
            // search query has narrowed the visible array down from the
            // store's real total — services_count is the uncapped figure.
            const matchedServicesCount = effectiveQ.trim() ? storeServices.length : store.services_count ?? storeServices.length;
            // In the map panel a shop drops down its services (designs live inside a service and are browsed from there); the
            // design carousel is only a fallback for a shop that matched on a design but has no matching service.
            const showServicesCarousel = inPanel
              ? storeServices.length > 0
              : isServicesFilter || (storeCarouselItems.length === 0 && storeServices.length > 0);

            const hasPin = (store.branches ?? []).some((b) => b.latitude && b.longitude);
            // Every shop says whether it alters & repairs at all (owner's rule, 2026-10-14).
            const altersRepairs = (store.services ?? []).some((svc) => svc.service_category === 'alterations_repairs');
            const hasCarousel = (showServicesCarousel && storeServices.length > 0) || storeCarouselItems.length > 0;
            const dropped = !inPanel || openIds.includes(store.id);

            const storeHref = gate(
              `/store/${store.slug}?tab=services${effectiveQ.trim() ? `&q=${encodeURIComponent(effectiveQ.trim())}` : ''}`
            );

            return (
              <div key={store.id} className="border-b border-line border-x-0 rounded-none px-0 py-3.5 space-y-2.5">
                {/* Store Header Row */}
                <div className="flex items-center gap-2">
                  {onShowOnMap && hasPin ? (
                    <button
                      type="button"
                      onClick={() => {
                        const qParam = effectiveQ.trim() ? `?tab=services&q=${encodeURIComponent(effectiveQ.trim())}` : '';
                        onShowOnMap(store.slug, qParam);
                      }}
                      className="group min-w-0 flex-1 text-left active:opacity-80 cursor-pointer"
                    >
                      <StoreRowInfo store={store} index={index} distKm={distKm} addressText={addressText} imageSrc={imageSrc} matchNote={matchNote} />
                    </button>
                  ) : (
                    <Link href={storeHref} className="group min-w-0 flex-1 active:opacity-80">
                      <StoreRowInfo store={store} index={index} distKm={distKm} addressText={addressText} imageSrc={imageSrc} matchNote={matchNote} />
                    </Link>
                  )}
                  {inPanel ? (
                    hasCarousel && (
                      <button
                        type="button"
                        onClick={() => setOpenIds((ids) => (ids.includes(store.id) ? ids.filter((i) => i !== store.id) : [...ids, store.id]))}
                        aria-expanded={dropped}
                        aria-label={dropped ? 'Hide services' : 'Show services'}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken"
                      >
                        {dropped ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    )
                  ) : (
                    <ChevronRight size={18} className="text-ink-faint shrink-0" />
                  )}
                </div>

                {dropped && (
                  <>
                {/* Carousel Header */}
                {showServicesCarousel && storeServices.length > 0 ? (
                  <div className="px-0.5 pt-0.5">
                    <span className="text-xs font-bold text-ink">
                      {effectiveQ.trim()
                        ? `${matchedServicesCount} matching tailoring service${matchedServicesCount === 1 ? '' : 's'}`
                        : `Tailoring services (${matchedServicesCount})`}
                    </span>
                  </div>
                ) : storeCarouselItems.length > 0 ? (
                  <div className="px-0.5 pt-0.5">
                    <span className="text-xs font-bold text-ink">
                      {effectiveQ.trim()
                        ? `${matchedCount} matching catalog design${matchedCount === 1 ? '' : 's'}`
                        : `Catalog designs (${matchedCount})`}
                    </span>
                  </div>
                ) : null}

                {/* Carousel */}
                {showServicesCarousel && storeServices.length > 0 ? (
                  <DragScrollRow label="Services">
                    {storeServices.map((svc) => (
                      // In the map panel a service opens inside the panel (its page in the shop's frame) instead of leaving the map.
                      <div
                        key={svc.id}
                        className="contents"
                        onClickCapture={(e) => {
                          addRecentItem({ kind: 'service', term: svc.name, href: `/store/${store.slug}/service/${svc.id}` });
                          if (inPanel && onShowOnMap && hasPin && onShowOnMap(store.slug, `/service/${svc.id}`)) e.preventDefault();
                        }}
                      >
                      <SearchServiceCard
                        service={{
                          id: svc.id,
                          name: svc.name,
                          category: svc.category,
                          service_type: (svc as { service_type?: string }).service_type || svc.service_types?.[0] || svc.category,
                          description: svc.description,
                          base_price: svc.base_price != null ? Number(svc.base_price) : null,
                          sale_price: svc.sale_price != null ? Number(svc.sale_price) : null,
                          estimated_days: svc.estimated_days ?? null,
                          image_url: svc.image_url ?? null,
                          reviews_count: svc.reviews_count ?? null,
                          reviews_avg_rating: svc.reviews_avg_rating ?? null,
                          orders_count: (svc as { orders_count?: number }).orders_count ?? null,
                          store: {
                            id: store.id,
                            name: store.name,
                            slug: store.slug,
                            branches: store.branches,
                            distance_km: store.distance_km,
                          },
                        }}
                        storeSlug={store.slug}
                        gate={gate}
                      />
                      </div>
                    ))}
                  </DragScrollRow>
                ) : storeCarouselItems.length > 0 ? (
                  <DragScrollRow label="Designs">
                    {storeCarouselItems.map((item) => (
                      <div
                        key={item.id}
                        className="snap-start w-[160px] shrink-0"
                        onClickCapture={(e) => {
                          addRecentItem({ kind: 'design', term: item.name, href: `/store/${store.slug}/catalog/${item.id}` });
                          if (inPanel && onShowOnMap && hasPin && onShowOnMap(store.slug, `/catalog/${item.id}`)) e.preventDefault();
                        }}
                      >
                        <CatalogItemCard item={toCatalogItemResult(item, store)} />
                      </div>
                    ))}
                  </DragScrollRow>
                ) : null}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!inPanel && activeTab === 'store' && userCoords && stores.length > 0 && (
        <div className="mt-3 py-2.5 px-0 flex items-center gap-2.5 text-ink-muted text-xs border-b border-line/60">
          <MapPin size={14} className="text-taupe shrink-0" />
          <span>Distances are ordered from your current location in Davao City.</span>
        </div>
      )}

      {!inPanel && activeTab === 'store' && (total > 0 || items.length > 0) && (
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
