'use client';

import React, { useMemo, useState } from 'react';
import { Package as PackageIcon } from 'lucide-react';
import CatalogGridToolbar from '@/components/catalog/CatalogGridToolbar';
import CatalogFilterSidebar from '@/components/catalog/CatalogFilterSidebar';
import CatalogFilterSheet from '@/components/catalog/CatalogFilterSheet';
import SearchServiceCard from '@/components/search/SearchServiceCard';
import type { SearchServiceResult } from '@/components/search/types';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import type { Service } from './serviceHelpers';
import ServiceFilterBody, { type ServiceStatusFilter } from './ServiceFilterBody';
import { DEFAULT_SERVICE_SORT, SERVICE_RANK_CHIPS, isServicePriceSort, type ServiceSortOption } from './serviceSort';

// The owner's own list, shown with the very same card customers see in
// search, so the shop sees its services exactly as customers do. One tap on a
// card opens the service's own page, where every section is editable.
function toCardResult(service: Service): SearchServiceResult {
  return {
    id: service.id,
    name: service.name,
    service_category: service.service_category ?? null,
    service_leaf_type: service.service_leaf_type ?? null,
    base_price: service.base_price != null ? Number(service.base_price) : null,
    sale_price: service.sale_price != null ? Number(service.sale_price) : null,
    estimated_days: service.estimated_days,
    estimated_days_max: service.estimated_days_max ?? null,
    image_url: service.image_url ?? null,
    reviews_count: service.reviews_count ?? 0,
    reviews_avg_rating: service.reviews_avg_rating ?? null,
    orders_count: service.job_orders_count ?? 0,
    store: null,
  };
}

const effectivePrice = (s: Service) => Number(s.sale_price ?? s.base_price ?? 0);

interface ServiceGridViewProps {
  readonly services: Service[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly storeSlug?: string;
}

export default function ServiceGridView({ services, loading, canManage }: Readonly<ServiceGridViewProps>) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<ServiceSortOption>(DEFAULT_SERVICE_SORT);
  const [statusFilter, setStatusFilter] = useState<ServiceStatusFilter>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    services.forEach((s) => s.service_category && counts.set(s.service_category, (counts.get(s.service_category) ?? 0) + 1));
    return Array.from(counts, ([value, count]) => ({ value, count }));
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services
      .filter((s) => {
        if (statusFilter === 'active' && !s.is_active) return false;
        if (statusFilter === 'paused' && s.is_active) return false;
        if (categoryFilter && s.service_category !== categoryFilter) return false;
        return !q || s.name.toLowerCase().includes(q) || (s.categories ?? []).some((c) => c.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'price_asc': return effectivePrice(a) - effectivePrice(b);
          case 'price_desc': return effectivePrice(b) - effectivePrice(a);
          case 'top_rated': return Number(b.reviews_avg_rating ?? 0) - Number(a.reviews_avg_rating ?? 0);
          case 'most_saved': return (b.saves_count ?? 0) - (a.saves_count ?? 0);
          default: return (b.job_orders_count ?? 0) - (a.job_orders_count ?? 0);
        }
      });
  }, [services, search, sortOrder, statusFilter, categoryFilter]);

  const activeFiltersCount = (isServicePriceSort(sortOrder) ? 1 : 0) + (statusFilter ? 1 : 0) + (categoryFilter ? 1 : 0);
  const resetAll = () => {
    setSortOrder(DEFAULT_SERVICE_SORT);
    setStatusFilter('');
    setCategoryFilter('');
  };

  if (loading) return <CardGridSkeleton count={8} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />;

  if (services.length === 0) {
    return (
      <div className="bg-surface border border-line p-12 text-center">
        <PackageIcon className="w-12 h-12 text-ink-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink mb-2">No services yet</h3>
        <p className="text-ink-muted text-sm max-w-md mx-auto">Add the services your shop offers — alterations, custom tailoring, printing — so customers can find and book them.</p>
      </div>
    );
  }

  const body = (
    <ServiceFilterBody
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      categoryFilter={categoryFilter}
      setCategoryFilter={setCategoryFilter}
      categoryOptions={categoryOptions}
    />
  );

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
      <CatalogFilterSidebar activeFiltersCount={activeFiltersCount} onResetAll={resetAll}>{body}</CatalogFilterSidebar>

      <div className="flex-1 min-w-0 space-y-5">
        <CatalogGridToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          chips={SERVICE_RANK_CHIPS}
          searchPlaceholder="Search by service name..."
          activeFiltersCount={activeFiltersCount}
          onOpenFilters={() => setSheetOpen(true)}
        />

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-ink-muted">
            <p>No services matched your current filters.</p>
            <button type="button" onClick={() => { setSearch(''); resetAll(); }} className="mt-2 text-taupe font-semibold hover:underline cursor-pointer">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((service) => (
              <SearchServiceCard
                key={service.id}
                service={toCardResult(service)}
                storeSlug=""
                gate={(href) => href}
                hrefOverride={`/dashboard/services/${service.id}`}
                isPaused={!service.is_active}
                hideLocation
                fluid
              />
            ))}
          </div>
        )}

        {!canManage && <p className="text-xs text-ink-faint">You can view services here. Only the owner or a branch manager can edit them.</p>}
      </div>

      <CatalogFilterSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} activeFiltersCount={activeFiltersCount} onResetAll={resetAll} resultCount={filtered.length}>
        {body}
      </CatalogFilterSheet>
    </div>
  );
}
