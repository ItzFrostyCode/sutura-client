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
  const minTierPrice = (service.pricing ?? [])
    .map((p) => Number(p.amount))
    .filter((a) => !isNaN(a) && a > 0);
  const startingPrice = service.base_price != null && Number(service.base_price) > 0
    ? Number(service.base_price)
    : minTierPrice.length > 0 ? Math.min(...minTierPrice) : null;

  return {
    id: service.id,
    name: service.name,
    service_category: service.service_category ?? null,
    base_price: startingPrice,
    sale_price: service.sale_price != null ? Number(service.sale_price) : null,
    estimated_days: service.estimated_days,
    estimated_days_max: service.estimated_days_max ?? null,
    image_url: service.image_url ?? null,
    reviews_count: service.reviews_count ?? 0,
    reviews_avg_rating: service.reviews_avg_rating ?? null,
    orders_count: service.job_orders_count ?? (service as any).orders_count ?? 0,
    saves_count: service.saves_count ?? 0,
    designs_count: service.catalog_items_count ?? service.catalog_items?.length ?? 0,
    store: null,
  };
}

import DashboardServiceCard from './DashboardServiceCard';

interface ServiceGridViewProps {
  readonly services: Service[];
  readonly loading: boolean;
  readonly canManage: boolean;
  readonly storeSlug?: string;
  readonly onEdit?: (id: number) => void;
  readonly onDelete?: (id: number) => void;
  readonly onDeleteDesign?: (id: number) => void;
}

export default function ServiceGridView({
  services,
  loading,
  canManage,
  onEdit,
  onDelete,
  onDeleteDesign,
}: Readonly<ServiceGridViewProps>) {
  const f = useServiceFilters(services);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { filtered, activeFiltersCount, resetAll, search, setSearch } = f;

  if (loading) return <CardGridSkeleton count={8} cols="grid-cols-1 sm:grid-cols-2" />;

  if (services.length === 0) {
    return (
      <div className="bg-surface border border-line p-12 text-center rounded-2xl">
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
          <div className="space-y-5 sm:space-y-6">
            {filtered.map((service) => (
              <DashboardServiceCard
                key={service.id}
                service={service}
                canManage={canManage}
                onEdit={onEdit}
                onDelete={onDelete}
                onDeleteDesign={onDeleteDesign}
              />
            ))}
          </div>
        )}

        {!canManage && <p className="text-xs text-ink-faint">You can view services here. Only the shop owner can edit them.</p>}
      </div>

      <CatalogFilterSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} activeFiltersCount={activeFiltersCount} onResetAll={resetAll} resultCount={filtered.length}>
        {body}
      </CatalogFilterSheet>
    </div>
  );
}
