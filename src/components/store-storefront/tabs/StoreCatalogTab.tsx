import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CatalogListItem, StoreProfile } from '../types';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import CatalogFilterChipsBar, { FilterChip } from '../catalog/CatalogFilterChipsBar';
import type { DeptKey } from '../catalog/StoreCatalogFilterSidebar';
import { DEPARTMENT_LABELS, garmentTypesForDepartment } from '@/lib/canonicalTaxonomy';
import type { CatalogItemResult } from '@/types/publicCatalog';

// CatalogListItem (this store's own catalog feed) is already shaped almost
// identically to the shared CatalogItemResult that CatalogItemCard expects —
// it's just missing the `store`/`order_count` fields, which are trivial to
// fill in here since the owning store is already known (storeId). Reusing
// the same card component every other catalog grid in the app uses (see
// SearchStoresTab.tsx's own toCatalogItemResult) keeps this store's own
// catalog page visually identical to how its items look everywhere else.
function toCatalogItemResult(item: CatalogListItem, storeId: string, store?: StoreProfile | null): CatalogItemResult {
  return {
    id: item.id,
    name: item.name,
    garment_type: item.garment_type ?? '',
    price: item.price != null ? Number(item.price) : null,
    material: item.material ?? null,
    color: item.color ?? null,
    estimated_days: item.estimated_days ?? null,
    reviews_count: item.reviews_count ?? 0,
    reviews_avg_rating: item.reviews_avg_rating ?? null,
    order_count: (item as { order_count?: number }).order_count ?? 0,
    images: item.images.map((img) => ({ image_url: img.image_url, is_primary: img.is_primary })),
    fabric_image_url: item.fabric_image_url ?? null,
    distance_km: null,
    store: {
      id: store?.id ?? 0,
      name: store?.name ?? '',
      slug: storeId,
      branches: store?.branches?.map((b) => ({
        id: b.id,
        name: b.name,
        is_main: Boolean(b.is_main),
        district: b.district ?? null,
        city: b.city ?? null,
        latitude: b.latitude,
        longitude: b.longitude,
      })),
    },
  };
}

interface StoreCatalogTabProps {
  readonly catalogLoading: boolean;
  readonly catalogItems: CatalogListItem[];
  readonly catalogSearch: string;
  readonly catalogGarmentTypeFilters: Set<string>;
  readonly toggleGarmentType: (g: string) => void;
  readonly departmentFilter: DeptKey;
  readonly setDepartmentFilter: (d: DeptKey) => void;
  readonly minPrice: string;
  readonly setMinPrice: (p: string) => void;
  readonly maxPrice: string;
  readonly setMaxPrice: (p: string) => void;
  readonly priceSort: '' | 'price_asc' | 'price_desc';
  readonly setPriceSort: (s: '' | 'price_asc' | 'price_desc') => void;
  readonly ratingFilter: string;
  readonly setRatingFilter: (r: string) => void;
  readonly resetFilterPanel: () => void;
  readonly highlightedItemId: number | null;
  readonly storeId: string;
  readonly store?: StoreProfile | null;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onDeleteItem: (id: number) => void;
}

export default function StoreCatalogTab({
  catalogLoading,
  catalogItems,
  catalogSearch,
  catalogGarmentTypeFilters,
  toggleGarmentType,
  departmentFilter,
  setDepartmentFilter,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  priceSort,
  setPriceSort,
  ratingFilter,
  setRatingFilter,
  resetFilterPanel,
  highlightedItemId,
  storeId,
  store,
  isOwnerViewingOwnStore,
  onDeleteItem,
}: StoreCatalogTabProps) {
  if (catalogLoading) {
    return <div className="text-center py-16 text-ink-faint animate-pulse mobile-body-sm">Curating showcase...</div>;
  }

  if (catalogItems.length === 0) {
    return (
      <div className="text-center py-16 bg-surface border border-line rounded-2xl p-6 text-ink-muted mobile-body-sm shadow-xs space-y-3">
        <p>This store hasn&apos;t published any showcase items yet.</p>
        {isOwnerViewingOwnStore && (
          <Link
            href="/dashboard/catalog/new"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-taupe hover:bg-taupe/90 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Your First Item
          </Link>
        )}
      </div>
    );
  }

  const departmentGarmentTypes = departmentFilter !== 'all' ? new Set(garmentTypesForDepartment(departmentFilter)) : null;

  const filteredCatalogItems = catalogItems
    .filter((item) => {
      if (catalogSearch && !item.name.toLowerCase().includes(catalogSearch.toLowerCase())) {
        return false;
      }
      if (departmentGarmentTypes && (!item.garment_type || !departmentGarmentTypes.has(item.garment_type))) {
        return false;
      }
      if (
        catalogGarmentTypeFilters.size > 0 &&
        (!item.garment_type || !catalogGarmentTypeFilters.has(item.garment_type))
      ) {
        return false;
      }
      const p = Number(item.price) || 0;
      if (minPrice && p < Number(minPrice)) return false;
      if (maxPrice && p > Number(maxPrice)) return false;

      if (ratingFilter) {
        const itemRating = Number(item.reviews_avg_rating ?? 0);
        if (itemRating < Number(ratingFilter)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (priceSort === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (priceSort === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
      return 0;
    });

  const activeFilterChips: FilterChip[] = [];
  if (departmentFilter !== 'all') {
    activeFilterChips.push({
      id: 'department',
      label: DEPARTMENT_LABELS[departmentFilter],
      onRemove: () => setDepartmentFilter('all'),
    });
  }
  if (priceSort) {
    activeFilterChips.push({
      id: 'sort',
      label: priceSort === 'price_asc' ? 'Sort: Low to High' : 'Sort: High to Low',
      onRemove: () => setPriceSort(''),
    });
  }
  if (minPrice && maxPrice) {
    activeFilterChips.push({
      id: 'price-range',
      label: `₱${Number(minPrice).toLocaleString()} – ₱${Number(maxPrice).toLocaleString()}`,
      onRemove: () => {
        setMinPrice('');
        setMaxPrice('');
      },
    });
  } else if (minPrice) {
    activeFilterChips.push({
      id: 'price-min',
      label: `Min ₱${Number(minPrice).toLocaleString()}`,
      onRemove: () => setMinPrice(''),
    });
  } else if (maxPrice) {
    activeFilterChips.push({
      id: 'price-max',
      label: `Max ₱${Number(maxPrice).toLocaleString()}`,
      onRemove: () => setMaxPrice(''),
    });
  }
  if (ratingFilter) {
    activeFilterChips.push({
      id: 'rating',
      label: `★ ${ratingFilter}${ratingFilter === '5' ? ' Stars' : '+ Stars'}`,
      onRemove: () => setRatingFilter(''),
    });
  }
  Array.from(catalogGarmentTypeFilters).forEach((g) => {
    activeFilterChips.push({
      id: `garment-${g}`,
      label: g,
      onRemove: () => toggleGarmentType(g),
    });
  });

  return (
    <div className="min-w-0">
      {isOwnerViewingOwnStore && (
        <div className="flex justify-end mb-3">
          <Link
            href="/dashboard/catalog/new"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 bg-taupe hover:bg-taupe/90 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Item
          </Link>
        </div>
      )}
      <CatalogFilterChipsBar
        totalCount={filteredCatalogItems.length}
        activeFilterChips={activeFilterChips}
        onClearAll={resetFilterPanel}
      />

      {filteredCatalogItems.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-line rounded-2xl p-6 text-ink-muted mobile-body-sm shadow-xs">
          No items match your search or filters. Try a different keyword or clear a filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredCatalogItems.map((item) => (
            <div
              key={item.id}
              id={`catalog-item-${item.id}`}
              className={highlightedItemId === item.id ? 'ring-2 ring-taupe' : undefined}
            >
              <CatalogItemCard
                item={toCatalogItemResult(item, storeId, store)}
                canManage={isOwnerViewingOwnStore}
                onDelete={onDeleteItem}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
