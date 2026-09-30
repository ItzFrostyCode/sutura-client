'use client';

import React from 'react';
import { FilterOption, FilterSection } from '@/components/catalog/CatalogFilterBody';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import { DEFAULT_SERVICE_SORT, SERVICE_PRICE_SORTS, isServicePriceSort, type ServiceSortOption } from './serviceSort';

export type ServiceStatusFilter = '' | 'active' | 'paused';

export interface ServiceFilterState {
  readonly sortOrder: ServiceSortOption;
  readonly setSortOrder: (v: ServiceSortOption) => void;
  readonly statusFilter: ServiceStatusFilter;
  readonly setStatusFilter: (v: ServiceStatusFilter) => void;
  readonly categoryFilter: string;
  readonly setCategoryFilter: (v: string) => void;
  /** Service categories this store actually has, with how many services in each. */
  readonly categoryOptions: { value: string; count: number }[];
}

// The service page's filter sections — same shell and rows as the catalog's.
export default function ServiceFilterBody({
  sortOrder,
  setSortOrder,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  categoryOptions,
}: Readonly<ServiceFilterState>) {
  return (
    <div>
      <FilterSection title="Sort by price">
        {SERVICE_PRICE_SORTS.map((opt) => (
          <FilterOption
            key={opt.value}
            selected={sortOrder === opt.value}
            onClick={() => setSortOrder(isServicePriceSort(sortOrder) && sortOrder === opt.value ? DEFAULT_SERVICE_SORT : opt.value)}
          >
            {opt.label}
          </FilterOption>
        ))}
      </FilterSection>

      <FilterSection title="Status">
        {([['', 'All services'], ['active', 'Active'], ['paused', 'Paused']] as const).map(([value, label]) => (
          <FilterOption key={value || 'all'} selected={statusFilter === value} onClick={() => setStatusFilter(value)}>
            {label}
          </FilterOption>
        ))}
      </FilterSection>

      {categoryOptions.length > 0 && (
        <FilterSection title="Narrow by Category">
          <div className="divide-y divide-line/60">
            <FilterOption selected={!categoryFilter} onClick={() => setCategoryFilter('')}>All Categories</FilterOption>
            {categoryOptions.map((c) => (
              <FilterOption key={c.value} selected={categoryFilter === c.value} onClick={() => setCategoryFilter(c.value)}>
                {SERVICE_CATEGORY_LABELS[c.value as ServiceCategory] ?? c.value} ({c.count})
              </FilterOption>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );
}
