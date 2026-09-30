// One sort at a time. The three ranking chips (Sold / Top Rated / Most
// Viewed) and the two price sorts in the filter are all values of this same
// state, so picking a price sort deselects the chips and vice versa.
export type CatalogSortOption = 'best_selling' | 'top_rated' | 'most_viewed' | 'price_asc' | 'price_desc';

export const DEFAULT_CATALOG_SORT: CatalogSortOption = 'best_selling';

// "Sold" (not "Best Selling") to match the "0 sold" count on every card.
export const RANK_CHIPS: { value: CatalogSortOption; label: string }[] = [
  { value: 'best_selling', label: 'Sold' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'most_viewed', label: 'Most Viewed' },
];

export const PRICE_SORTS: { value: CatalogSortOption; label: string }[] = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export const isPriceSort = (v: CatalogSortOption) => v === 'price_asc' || v === 'price_desc';
