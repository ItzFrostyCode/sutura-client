import React from 'react';
import { CatalogListItem } from '../types';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import CatalogFilterChipsBar, { FilterChip } from '../catalog/CatalogFilterChipsBar';
import type { CatalogItemResult } from '@/types/publicCatalog';

// CatalogListItem (this store's own catalog feed) is already shaped almost
// identically to the shared CatalogItemResult that CatalogItemCard expects —
// it's just missing the `store`/`order_count` fields, which are trivial to
// fill in here since the owning store is already known (storeId). Reusing
// the same card component every other catalog grid in the app uses (see
// SearchStoresTab.tsx's own toCatalogItemResult) keeps this store's own
// catalog page visually identical to how its items look everywhere else.
function toCatalogItemResult(item: CatalogListItem, storeId: string): CatalogItemResult {
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
    order_count: 0,
    images: item.images.map((img) => ({ image_url: img.image_url, is_primary: img.is_primary })),
    fabric_image_url: item.fabric_image_url ?? null,
    distance_km: null,
    store: { id: 0, name: '', slug: storeId },
  };
}

interface StoreCatalogTabProps {
  readonly catalogLoading: boolean;
  readonly catalogItems: CatalogListItem[];
  readonly catalogSearch: string;
  readonly catalogGarmentTypeFilters: Set<string>;
  readonly toggleGarmentType: (g: string) => void;
  readonly minPrice: string;
  readonly setMinPrice: (p: string) => void;
  readonly maxPrice: string;
  readonly setMaxPrice: (p: string) => void;
  readonly priceSort: '' | 'price_asc' | 'price_desc';
  readonly setPriceSort: (s: '' | 'price_asc' | 'price_desc') => void;
  readonly colorFilter: string;
  readonly setColorFilter: (c: string) => void;
  readonly ratingFilter: string;
  readonly setRatingFilter: (r: string) => void;
  readonly resetFilterPanel: () => void;
  readonly showPortfolioFabric: boolean;
  readonly setShowPortfolioFabric: React.Dispatch<React.SetStateAction<boolean>>;
  readonly highlightedItemId: number | null;
  readonly storeId: string;
}

export default function StoreCatalogTab({
  catalogLoading,
  catalogItems,
  catalogSearch,
  catalogGarmentTypeFilters,
  toggleGarmentType,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  priceSort,
  setPriceSort,
  colorFilter,
  setColorFilter,
  ratingFilter,
  setRatingFilter,
  resetFilterPanel,
  showPortfolioFabric,
  setShowPortfolioFabric,
  highlightedItemId,
  storeId,
}: StoreCatalogTabProps) {
  if (catalogLoading) {
    return <div className="text-center py-16 text-ink-faint animate-pulse mobile-body-sm">Curating showcase...</div>;
  }

  if (catalogItems.length === 0) {
    return (
      <div className="text-center py-16 bg-surface border border-line rounded-2xl p-6 text-ink-muted mobile-body-sm shadow-xs">
        This store hasn&apos;t published any showcase items yet.
      </div>
    );
  }

  const filteredCatalogItems = catalogItems
    .filter((item) => {
      if (catalogSearch && !item.name.toLowerCase().includes(catalogSearch.toLowerCase())) {
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

      if (colorFilter) {
        const selectedList = colorFilter.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        const ic = (item.color || '').toLowerCase();
        const iname = (item.name || '').toLowerCase();
        const viewAngles = (item.images || []).map((img) => (img.view_angle || '').toLowerCase()).join(' ');
        const ifab = (item.material || '').toLowerCase();
        const matchesAny = selectedList.some(
          (sc) => ic.includes(sc) || iname.includes(sc) || viewAngles.includes(sc) || ifab.includes(sc)
        );
        if (!matchesAny) {
          return false;
        }
      }

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
  if (colorFilter) {
    const list = colorFilter.split(',').map((s) => s.trim()).filter(Boolean);
    list.forEach((col) => {
      activeFilterChips.push({
        id: `color-${col}`,
        label: `Color: ${col}`,
        onRemove: () => {
          const rem = list.filter((c) => c.toLowerCase() !== col.toLowerCase()).join(',');
          setColorFilter(rem);
        },
      });
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
      <CatalogFilterChipsBar
        totalCount={filteredCatalogItems.length}
        activeFilterChips={activeFilterChips}
        onClearAll={resetFilterPanel}
        showPortfolioFabric={showPortfolioFabric}
        onTogglePortfolioFabric={() => setShowPortfolioFabric((v) => !v)}
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
                item={toCatalogItemResult(item, storeId)}
                showFabric={showPortfolioFabric}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
