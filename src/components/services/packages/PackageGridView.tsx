'use client';

import React, { useMemo, useState } from 'react';
import { Package as PackageIcon } from 'lucide-react';
import CatalogGridToolbar from '@/components/catalog/CatalogGridToolbar';
import CatalogFilterSidebar from '@/components/catalog/CatalogFilterSidebar';
import CatalogFilterSheet from '@/components/catalog/CatalogFilterSheet';
import { FilterOption, FilterSection } from '@/components/catalog/CatalogFilterBody';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import type { ServicePackage } from '../serviceHelpers';
import PackageGridCard from './PackageGridCard';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import { pricedTotal } from './packageEditing';

type Sort = 'newest' | 'price_asc' | 'price_desc';
type Status = '' | 'active' | 'paused';

const CHIPS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];
const priceOf = (p: ServicePackage) => (p.bundle_price ? Number(p.bundle_price) : pricedTotal(p.services));

// Same list as Individual Services — search, filter, grid of cards — for combo packages.
export default function PackageGridView({ packages, loading }: Readonly<{ packages: ServicePackage[]; loading: boolean }>) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [status, setStatus] = useState<Status>('');
  const [category, setCategory] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    packages.forEach((p) => p.service_category && counts.set(p.service_category, (counts.get(p.service_category) ?? 0) + 1));
    return Array.from(counts, ([value, count]) => ({ value, count }));
  }, [packages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages
      .filter((p) => (status === 'active' ? p.is_active : status === 'paused' ? !p.is_active : true) && (!category || p.service_category === category) && (!q || p.name.toLowerCase().includes(q)))
      .sort((a, b) => (sort === 'price_asc' ? priceOf(a) - priceOf(b) : sort === 'price_desc' ? priceOf(b) - priceOf(a) : b.id - a.id));
  }, [packages, search, sort, status, category]);

  const activeFiltersCount = (status ? 1 : 0) + (sort !== 'newest' ? 1 : 0) + (category ? 1 : 0);
  const resetAll = () => { setStatus(''); setSort('newest'); setCategory(''); };

  if (loading) return <CardGridSkeleton count={8} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />;

  if (packages.length === 0) {
    return (
      <div className="bg-surface border border-line p-12 text-center">
        <PackageIcon className="w-12 h-12 text-ink-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink mb-2">No packages yet</h3>
        <p className="text-ink-muted text-sm max-w-md mx-auto">Bundle 2 or more services into one combo deal at a single price.</p>
      </div>
    );
  }

  const body = (
    <div>
      <FilterSection title="Status">
        {([['', 'All packages'], ['active', 'Active'], ['paused', 'Paused']] as const).map(([value, label]) => (
          <FilterOption key={value || 'all'} selected={status === value} onClick={() => setStatus(value)}>{label}</FilterOption>
        ))}
      </FilterSection>
      {categoryOptions.length > 0 && (
        <FilterSection title="Narrow by Category">
          <div className="divide-y divide-line/60">
            <FilterOption selected={!category} onClick={() => setCategory('')}>All Categories</FilterOption>
            {categoryOptions.map((c) => (
              <FilterOption key={c.value} selected={category === c.value} onClick={() => setCategory(c.value)}>
                {SERVICE_CATEGORY_LABELS[c.value as ServiceCategory] ?? c.value} ({c.count})
              </FilterOption>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
      <CatalogFilterSidebar activeFiltersCount={activeFiltersCount} onResetAll={resetAll}>{body}</CatalogFilterSidebar>

      <div className="flex-1 min-w-0 space-y-5">
        <CatalogGridToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          sortOrder={sort}
          setSortOrder={setSort}
          chips={CHIPS}
          searchPlaceholder="Search by package name..."
          activeFiltersCount={activeFiltersCount}
          onOpenFilters={() => setSheetOpen(true)}
        />
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-ink-muted">
            <p>No packages matched your current filters.</p>
            <button type="button" onClick={() => { setSearch(''); resetAll(); }} className="mt-2 text-taupe font-semibold hover:underline cursor-pointer">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((p) => <PackageGridCard key={p.id} pkg={p} />)}
          </div>
        )}
      </div>

      <CatalogFilterSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} activeFiltersCount={activeFiltersCount} onResetAll={resetAll} resultCount={filtered.length}>
        {body}
      </CatalogFilterSheet>
    </div>
  );
}
