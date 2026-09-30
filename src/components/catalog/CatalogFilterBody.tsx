'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { DEPARTMENTS, DEPARTMENT_LABELS, GARMENT_TYPE_LABELS, type Department } from '@/lib/canonicalTaxonomy';
import { PRICE_SORTS, DEFAULT_CATALOG_SORT, isPriceSort, type CatalogSortOption } from './catalogSort';

function humanizeGarmentType(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface CatalogFilterState {
  readonly departmentFilter: '' | Department;
  readonly setDepartmentFilter: (v: '' | Department) => void;
  readonly garmentTypeFilter: string;
  readonly setGarmentTypeFilter: (v: string) => void;
  readonly garmentTypeOptions: string[];
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
  departmentFilter,
  setDepartmentFilter,
  garmentTypeFilter,
  setGarmentTypeFilter,
  garmentTypeOptions,
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

      <FilterSection title="Department">
        <FilterOption selected={!departmentFilter} onClick={() => { setDepartmentFilter(''); setGarmentTypeFilter(''); }}>
          All Departments
        </FilterOption>
        {DEPARTMENTS.map(dept => (
          <FilterOption key={dept} selected={departmentFilter === dept} onClick={() => { setDepartmentFilter(dept); setGarmentTypeFilter(''); }}>
            {DEPARTMENT_LABELS[dept]}
          </FilterOption>
        ))}
      </FilterSection>

      {garmentTypeOptions.length > 0 && (
        <FilterSection title="Narrow by Category">
          <div className="divide-y divide-line/60">
            <FilterOption selected={!garmentTypeFilter} onClick={() => setGarmentTypeFilter('')}>All Categories</FilterOption>
            {garmentTypeOptions.map(gt => (
              <FilterOption key={gt} selected={garmentTypeFilter === gt} onClick={() => setGarmentTypeFilter(gt)}>
                {GARMENT_TYPE_LABELS[gt] ?? humanizeGarmentType(gt)}
              </FilterOption>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );
}
