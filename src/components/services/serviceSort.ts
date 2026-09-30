// One sort at a time, same idea as the catalog's: the three round chips and
// the price sorts in the filter are all values of this one state.
export type ServiceSortOption = 'best_selling' | 'top_rated' | 'most_saved' | 'price_asc' | 'price_desc';

export const DEFAULT_SERVICE_SORT: ServiceSortOption = 'best_selling';

// "Sold" to match the "N sold" count on every service card.
export const SERVICE_RANK_CHIPS: { value: ServiceSortOption; label: string }[] = [
  { value: 'best_selling', label: 'Sold' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'most_saved', label: 'Most Saved' },
];

export const SERVICE_PRICE_SORTS: { value: ServiceSortOption; label: string }[] = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export const isServicePriceSort = (v: ServiceSortOption) => v === 'price_asc' || v === 'price_desc';
