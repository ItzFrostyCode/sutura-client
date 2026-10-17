'use client';

import React, { useState } from 'react';
import { Package as PackageIcon } from 'lucide-react';
import CatalogGridToolbar from '@/components/catalog/CatalogGridToolbar';
import CatalogFilterSidebar from '@/components/catalog/CatalogFilterSidebar';
import CatalogFilterSheet from '@/components/catalog/CatalogFilterSheet';
import SearchServiceCard from '@/components/search/SearchServiceCard';
import type { SearchServiceResult } from '@/components/search/types';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import type { Service } from './serviceHelpers';
import ServiceFilterBody from './ServiceFilterBody';
import { useServiceFilters } from './useServiceFilters';
import { SERVICE_RANK_CHIPS } from './serviceSort';

// The owner's own list, shown with the very same card customers see in
// search, so the shop sees its services exactly as customers do. One tap on a
// card opens the service's own page, where every section is editable.
function toCardResult(service: Service): SearchServiceResult {
  return {
    id: service.id,
    name: service.name,
    service_category: service.service_category ?? null,
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

interface ServiceGridViewProps {
  readonly services: Service[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly storeSlug?: string;
}

export default function ServiceGridView({ services, loading, canManage }: Readonly<ServiceGridViewProps>) {
  const f = useServiceFilters(services);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { filtered, activeFiltersCount, resetAll, search, setSearch } = f;

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

  const body = <ServiceFilterBody f={f} />;

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
      <CatalogFilterSidebar activeFiltersCount={activeFiltersCount} onResetAll={resetAll}>{body}</CatalogFilterSidebar>

      <div className="flex-1 min-w-0 space-y-5">
        <CatalogGridToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          sortOrder={f.sortOrder}
          setSortOrder={f.setSortOrder}
          chips={SERVICE_RANK_CHIPS}
          searchPlaceholder="Search a service, garment or task…"
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
