'use client';

import React from 'react';
import { FilterOption, FilterSection } from '@/components/catalog/CatalogFilterBody';
import { DEFAULT_SERVICE_SORT, SERVICE_PRICE_SORTS, isServicePriceSort } from './serviceSort';
import type { CountedOption } from './serviceTaxonomyFilters';
import type { ServiceFilters } from './useServiceFilters';

export type ServiceStatusFilter = '' | 'active' | 'paused';

function Choice({ title, options, value, onChange, all }: Readonly<{ title: string; options: CountedOption[]; value: string; onChange: (v: string) => void; all: string }>) {
  if (options.length === 0) return null;
  return (
    <FilterSection title={title}>
      <div className="divide-y divide-line/60">
        <FilterOption selected={!value} onClick={() => onChange('')}>{all}</FilterOption>
        {options.map((o) => (
          <FilterOption key={o.value} selected={value === o.value} onClick={() => onChange(o.value)}>{o.label} ({o.count})</FilterOption>
        ))}
      </div>
    </FilterSection>
  );
}

// The services page's filter sections — same shell and rows as the catalog's, and the same three levels the customer
// side searches by: kind of work, garment category, task.
export default function ServiceFilterBody({ f }: Readonly<{ f: ServiceFilters }>) {
  return (
    <div>
      <FilterSection title="Sort by price">
        {SERVICE_PRICE_SORTS.map((opt) => (
          <FilterOption key={opt.value} selected={f.sortOrder === opt.value} onClick={() => f.setSortOrder(isServicePriceSort(f.sortOrder) && f.sortOrder === opt.value ? DEFAULT_SERVICE_SORT : opt.value)}>
            {opt.label}
          </FilterOption>
        ))}
      </FilterSection>

      <FilterSection title="Status">
        {([['', 'All services'], ['active', 'Active'], ['paused', 'Paused']] as const).map(([value, label]) => (
          <FilterOption key={value || 'all'} selected={f.statusFilter === value} onClick={() => f.setStatusFilter(value)}>{label}</FilterOption>
        ))}
      </FilterSection>

      <Choice title="Kind of work" options={f.options.kinds} value={f.kindFilter} onChange={f.chooseKind} all="All kinds of work" />
      <Choice title="Garment" options={f.options.garments} value={f.garmentFilter} onChange={f.setGarmentFilter} all="All garments" />
      <Choice title="Task" options={f.options.tasks} value={f.taskFilter} onChange={f.setTaskFilter} all="All tasks" />
    </div>
  );
}
