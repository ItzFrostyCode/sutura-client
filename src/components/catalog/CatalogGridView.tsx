'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Image as ImageIcon, Eye, TrendingUp, Star, Scissors, Clock, Heart, Pencil } from 'lucide-react';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import type { Service } from '@/components/services/serviceHelpers';

import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import CatalogGridToolbar from '@/components/catalog/CatalogGridToolbar';
import CatalogFilterSidebar from '@/components/catalog/CatalogFilterSidebar';
import CatalogFilterSheet from '@/components/catalog/CatalogFilterSheet';
import CatalogFilterBody from '@/components/catalog/CatalogFilterBody';
import { DEFAULT_CATALOG_SORT, isPriceSort, type CatalogSortOption } from '@/components/catalog/catalogSort';
import StatBand from '@/components/shared/StatBand';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { GARMENT_CATEGORY_KEYS, canonicalGarment, categoryOfGarment, type GarmentCategory } from '@/lib/garmentTaxonomy';
import { apparelReviewBadge } from './ApparelReviewNotice';

// Same card style every customer-facing catalog grid uses (search, store
// profile, landing showroom) — reused here instead of a second, differently
// designed card, so the owner sees their own catalog exactly as customers
// do. Location is dropped (every item here is obviously this store's own).
// Garment Category → Garment, from the shop's own designs (an old slug counts as the garment it was merged
// into). A typed-in garment name sits under "Other Garments".
const garmentOf = (item: CatalogItem) => canonicalGarment(item.garment_type);
const categoryOf = (item: CatalogItem): GarmentCategory | null =>
  item.garment_type ? (categoryOfGarment(item.garment_type) ?? 'other') : null;

const customerPrice = (item: CatalogItem) => (item.pricing ? item.pricing.amount ?? 0 : Number(item.price) || 0);

function toCatalogItemResult(item: CatalogItem): CatalogItemResult {
  return {
    id: item.id,
    name: item.name,
    garment_type: item.garment_type ?? '',
    service_id: item.service_id != null ? Number(item.service_id) : (item.service?.id ?? null),
    service_name: item.service?.name ?? null,
    service: item.service ?? null,
    price: item.price != null ? Number(item.price) : null,
    pricing: item.pricing ?? null,
    material: item.material ?? null,
    color: item.color ?? null,
    estimated_days: item.estimated_days ?? null,
    reviews_count: item.reviews_count ?? 0,
    reviews_avg_rating: item.reviews_avg_rating ?? null,
    order_count: item.order_count ?? 0,
    images: item.images.map((img) => ({ image_url: img.image_url, is_primary: img.is_primary })),
    fabric_image_url: item.fabric_image_url ?? null,
    store: null,
  };
}

export default function CatalogGridView() {
  const router = useRouter();
  const { store, user } = useAuthStore();
  const searchParams = useSearchParams();
  const initialServiceId = searchParams?.get('service_id') || '';

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>(initialServiceId);
  const [categoryFilter, setCategoryFilter] = useState<'' | GarmentCategory>('');
  const [garmentTypeFilter, setGarmentTypeFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<CatalogSortOption>(DEFAULT_CATALOG_SORT);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Sync serviceFilter with URL query param whenever searchParams changes
  useEffect(() => {
    setServiceFilter(searchParams?.get('service_id') || '');
  }, [searchParams]);

  const handleClearServiceFilter = useCallback(() => {
    setServiceFilter('');
    router.replace('/dashboard/catalog');
  }, [router]);

  const fetchItems = useCallback(() => {
    if (store?.id) {
      setTimeout(() => setLoading(true), 0);
      Promise.all([
        api.get(`/stores/${store.id}/catalog`),
        api.get(`/stores/${store.id}/services`).catch(() => ({ data: { data: [] } })),
      ])
        .then(([catRes, srvRes]) => {
          setItems(catRes.data.data ?? []);
          setServices(srvRes.data.data ?? []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user?.id) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [store, user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const serviceOptions = useMemo(() => {
    const map = new Map<number, string>();
    services.forEach((s) => {
      map.set(s.id, s.name);
    });
    items.forEach((item) => {
      const sId = item.service_id != null ? Number(item.service_id) : item.service?.id;
      const sName = item.service?.name;
      if (sId && sName && !map.has(sId)) {
        map.set(sId, sName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [services, items]);

  const activeService = useMemo<Service | null>(() => {
    if (!serviceFilter) return null;
    const found = services.find(s => String(s.id) === serviceFilter);
    if (found) return found;
    const matchingItem = items.find(i => String(i.service_id) === serviceFilter || String(i.service?.id) === serviceFilter);
    if (matchingItem?.service) {
      return {
        id: matchingItem.service.id,
        name: matchingItem.service.name,
      } as any;
    }
    return null;
  }, [serviceFilter, services, items]);

  const categoryOptions = useMemo(() => {
    const inStock = new Set(items.map(categoryOf).filter(Boolean) as GarmentCategory[]);
    return GARMENT_CATEGORY_KEYS.filter(c => inStock.has(c));
  }, [items]);

  const garmentTypeOptions = useMemo(() => {
    if (!categoryFilter) return [];
    return Array.from(new Set(items.filter(i => categoryOf(i) === categoryFilter).map(garmentOf).filter(Boolean) as string[]));
  }, [items, categoryFilter]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesService = !serviceFilter || String(item.service_id) === serviceFilter || String(item.service?.id) === serviceFilter;
        const matchesCategory = !categoryFilter || categoryOf(item) === categoryFilter;
        const matchesType = !garmentTypeFilter || garmentOf(item) === garmentTypeFilter;
        return matchesSearch && matchesService && matchesCategory && matchesType;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          // By what customers actually see (the service's price, plus any extra); a quote sorts as 0.
          case 'price_asc': return customerPrice(a) - customerPrice(b);
          case 'price_desc': return customerPrice(b) - customerPrice(a);
          case 'best_selling': return (b.order_count ?? 0) - (a.order_count ?? 0);
          case 'top_rated': return Number(b.reviews_avg_rating ?? 0) - Number(a.reviews_avg_rating ?? 0);
          case 'most_viewed': return (b.views_count ?? 0) - (a.views_count ?? 0);
          default: return Number(b.order_count ?? 0) - Number(a.order_count ?? 0);
        }
      });
  }, [items, searchQuery, serviceFilter, categoryFilter, garmentTypeFilter, sortOrder]);

  const activeFiltersCount = (serviceFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (garmentTypeFilter ? 1 : 0) + (isPriceSort(sortOrder) ? 1 : 0);

  const resetAllFilters = () => {
    setServiceFilter('');
    setCategoryFilter('');
    setGarmentTypeFilter('');
    setSortOrder(DEFAULT_CATALOG_SORT);
  };

  const filterProps = {
    serviceOptions,
    serviceFilter,
    setServiceFilter,
    categoryOptions,
    categoryFilter,
    setCategoryFilter,
    garmentTypeFilter,
    setGarmentTypeFilter,
    garmentTypeOptions,
    sortOrder,
    setSortOrder,
  };

  const activeServiceImage = useMemo(() => {
    if (!activeService) return null;
    return (
      activeService.image_url ||
      activeService.catalog_items?.[0]?.images?.find((img) => img.is_primary)?.image_url ||
      activeService.catalog_items?.[0]?.images?.[0]?.image_url ||
      items.find(i => String(i.service_id) === serviceFilter)?.images?.find(img => img.is_primary)?.image_url ||
      items.find(i => String(i.service_id) === serviceFilter)?.images?.[0]?.image_url ||
      null
    );
  }, [activeService, items, serviceFilter]);

  if (loading) {
    return <CardGridSkeleton count={10} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {items.length > 0 && (() => {
        const totalViews = items.reduce((sum, i) => sum + (i.views_count || 0), 0);
        const totalRevenue = items.reduce((sum, i) => sum + Number(i.total_revenue || 0), 0);
        const rated = items.filter(i => i.reviews_count > 0);
        const avgRating = rated.length > 0
          ? rated.reduce((sum, i) => sum + Number(i.reviews_avg_rating || 0), 0) / rated.length
          : null;
        return (
          <StatBand
            items={[
              { label: 'Catalog Size', value: items.length, icon: ImageIcon },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye },
              { label: 'Catalog Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: TrendingUp, tone: 'sage' },
              { label: 'Avg. Rating', value: avgRating !== null ? avgRating.toFixed(1) : '—', icon: Star },
            ]}
          />
        );
      })()}

      {items.length === 0 ? (
        <div className="bg-surface border border-line p-12 text-center">
          <ImageIcon className="w-12 h-12 text-ink-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ink mb-2">No items in your catalog</h3>
          <p className="text-ink-muted text-sm mb-6 max-w-md mx-auto">
            Showcase your best tailoring work. Add items like Tuxedos, Dresses, or suits with detailed specs and images.
          </p>
          <Link
            href="/dashboard/catalog/new"
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2 font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            <span>Create Item</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
          <CatalogFilterSidebar activeFiltersCount={activeFiltersCount} onResetAll={resetAllFilters}>
            <CatalogFilterBody {...filterProps} />
          </CatalogFilterSidebar>

          <div className="flex-1 min-w-0 space-y-5">
            {activeService && (
              <div className="rounded-2xl bg-surface border border-line p-4 sm:p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sunken text-ink-faint border border-line">
                      {activeServiceImage ? (
                        <Image src={getMediaUrl(activeServiceImage)} alt="" fill sizes="64px" className="object-cover" />
                      ) : (
                        <Scissors size={22} className="text-taupe" />
                      )}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-taupe bg-taupe/10 px-2 py-0.5 rounded-full">
                          Service
                        </span>
                        <span className="text-xs text-ink-muted">
                          {filteredItems.length} design{filteredItems.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <h2 className="mobile-h4 sm:mobile-h3 font-bold text-ink truncate">
                        {activeService.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                        {activeService.base_price && Number(activeService.base_price) > 0 ? (
                          <>
                            <span className="font-semibold text-ink">
                              From ₱{Number(activeService.base_price).toLocaleString('en-PH', { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-ink-faint">|</span>
                          </>
                        ) : null}
                        <div className="flex items-center gap-1 shrink-0">
                          <Star size={11} className="fill-amber-400 text-amber-500 shrink-0" />
                          <span className="font-semibold text-ink">
                            {activeService.reviews_avg_rating && Number(activeService.reviews_avg_rating) > 0
                              ? Number(activeService.reviews_avg_rating).toFixed(1)
                              : '0.0'}
                          </span>
                        </div>
                        <span className="text-ink-faint">|</span>
                        <span>{(activeService as any).orders_count ?? activeService.job_orders_count ?? 0} sold</span>
                        <span className="text-ink-faint">|</span>
                        <span className="flex items-center gap-0.5 text-rose-600 shrink-0">
                          <Heart size={10} className="fill-rose-500 text-rose-500 shrink-0" />
                          <span>{activeService.saves_count ?? 0}</span>
                        </span>
                        {activeService.estimated_days ? (
                          <>
                            <span className="text-ink-faint">|</span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-taupe shrink-0" />
                              <span>
                                Est. {formatServiceTurnaround(activeService.estimated_days, activeService.estimated_days_max ?? null)}
                              </span>
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                    <Link
                      href={`/dashboard/catalog/new?service_id=${activeService.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-white bg-ink hover:bg-taupe px-3.5 py-2 rounded-full transition-colors cursor-pointer"
                    >
                      <Plus size={14} /> Add Design
                    </Link>
                    <Link
                      href={`/dashboard/services/${activeService.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-ink bg-sunken hover:bg-canvas border border-line px-3.5 py-2 rounded-full transition-colors cursor-pointer"
                    >
                      <Pencil size={13} /> Edit Service
                    </Link>
                    <button
                      type="button"
                      onClick={handleClearServiceFilter}
                      className="text-xs text-ink-muted hover:text-danger font-medium px-2 py-1 underline cursor-pointer"
                    >
                      Show all designs
                    </button>
                  </div>
                </div>
              </div>
            )}

            <CatalogGridToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              activeFiltersCount={activeFiltersCount}
              onOpenFilters={() => setFilterSheetOpen(true)}
            />

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-ink-muted">
                <p>No items matched your current filters.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); resetAllFilters(); }}
                  className="mt-2 text-taupe font-semibold hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredItems.map(item => (
                  <CatalogItemCard
                    key={item.id}
                    item={toCatalogItemResult(item)}
                    hideLocation
                    hrefOverride={`/dashboard/catalog/${item.id}`}
                    isPaused={item.is_active === false}
                    reviewBadge={apparelReviewBadge(item.apparel_review)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <CatalogFilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        activeFiltersCount={activeFiltersCount}
        onResetAll={resetAllFilters}
        resultCount={filteredItems.length}
      >
        <CatalogFilterBody {...filterProps} />
      </CatalogFilterSheet>
    </div>
  );
}
