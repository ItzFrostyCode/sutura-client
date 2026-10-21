'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { GARMENT_CATEGORIES, GARMENTS, type GarmentCategory } from '@/lib/garmentTaxonomy';
import { PRICE_SORTS, DEFAULT_CATALOG_SORT, isPriceSort, type CatalogSortOption } from './catalogSort';

export interface CatalogFilterState {
  /** Garment categories that have at least one of the shop's designs. */
  readonly categoryOptions: GarmentCategory[];
  readonly categoryFilter: '' | GarmentCategory;
  readonly setCategoryFilter: (v: '' | GarmentCategory) => void;
  /** Garments (current slugs) of the chosen category that the shop has designs for. */
  readonly garmentTypeFilter: string;
  readonly setGarmentTypeFilter: (v: string) => void;
  readonly garmentTypeOptions: string[];
  readonly serviceOptions?: { id: number; name: string }[];
  readonly serviceFilter?: string;
  readonly setServiceFilter?: (v: string) => void;
  readonly sortOrder: CatalogSortOption;
  readonly setSortOrder: (v: CatalogSortOption) => void;
}

export function FilterOption({ selected, onClick, children }: Readonly<{ selected: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 md:px-3 min-h-11 md:min-h-9 text-sm md:text-xs text-left transition-colors cursor-pointer ${
        selected ? 'bg-canvas font-bold text-ink' : 'hover:bg-canvas/60 text-ink-body'
      }`}
    >
      <span className={`w-4 h-4 md:w-3.5 md:h-3.5 border flex items-center justify-center shrink-0 ${selected ? 'bg-ink border-ink text-white' : 'border-line'}`}>
        {selected && <Check size={10} strokeWidth={3.5} />}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );
}

export function FilterSection({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full bg-canvas px-4 md:px-3 min-h-11 md:min-h-9 text-[11px] md:text-[10px] font-bold uppercase tracking-wider text-ink-muted border-b border-line flex items-center justify-between hover:bg-sunken transition-colors cursor-pointer"
      >
        <span>{title}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="divide-y divide-line/60">{children}</div>}
    </div>
  );
}

// The filter sections, shared by the desktop sidebar and the mobile sheet.
// Price sorting lives here (it's a one-off choice); the everyday rankings
// are the chips next to the search box.
export default function CatalogFilterBody({
  categoryOptions,
  categoryFilter,
  setCategoryFilter,
  garmentTypeFilter,
  setGarmentTypeFilter,
  garmentTypeOptions,
  serviceOptions,
  serviceFilter,
  setServiceFilter,
  sortOrder,
  setSortOrder,
}: Readonly<CatalogFilterState>) {
  return (
    <div>
      <FilterSection title="Sort by price">
        {PRICE_SORTS.map(opt => (
          <FilterOption
            key={opt.value}
            selected={sortOrder === opt.value}
            onClick={() => setSortOrder(isPriceSort(sortOrder) && sortOrder === opt.value ? DEFAULT_CATALOG_SORT : opt.value)}
          >
            {opt.label}
          </FilterOption>
        ))}
      </FilterSection>

      {serviceOptions && serviceOptions.length > 0 && setServiceFilter && (
        <FilterSection title="Parent Service">
          <FilterOption selected={!serviceFilter} onClick={() => setServiceFilter('')}>
            All services
          </FilterOption>
          {serviceOptions.map(svc => (
            <FilterOption
              key={svc.id}
              selected={serviceFilter === String(svc.id)}
              onClick={() => setServiceFilter(serviceFilter === String(svc.id) ? '' : String(svc.id))}
            >
              {svc.name}
            </FilterOption>
          ))}
        </FilterSection>
      )}

      <FilterSection title="Garment category">
        <FilterOption selected={!categoryFilter} onClick={() => { setCategoryFilter(''); setGarmentTypeFilter(''); }}>
          All categories
        </FilterOption>
        {categoryOptions.map(cat => (
          <FilterOption key={cat} selected={categoryFilter === cat} onClick={() => { setCategoryFilter(cat); setGarmentTypeFilter(''); }}>
            {GARMENT_CATEGORIES[cat].label}
          </FilterOption>
        ))}
      </FilterSection>

      {categoryFilter && garmentTypeOptions.length > 0 && (
        <FilterSection title="Garment">
          <div className="divide-y divide-line/60">
            <FilterOption selected={!garmentTypeFilter} onClick={() => setGarmentTypeFilter('')}>All garments</FilterOption>
            {garmentTypeOptions.map(gt => (
              <FilterOption key={gt} selected={garmentTypeFilter === gt} onClick={() => setGarmentTypeFilter(gt)}>
                {GARMENTS[gt]?.label ?? gt}
              </FilterOption>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );
}
