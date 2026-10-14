export type ShopStatusFilter = 'all' | 'open' | 'closed';

/** radiusKm null = Auto: nearest first with no distance cut-off. */
export interface NearFilters {
  radiusKm: number | null;
  status: ShopStatusFilter;
}

export const DEFAULT_NEAR_FILTERS: NearFilters = { radiusKm: null, status: 'all' };

/** 50 km from the city centre covers the whole of Davao City, so the slider stops there. */
export const MIN_RADIUS_KM = 5;
export const MAX_RADIUS_KM = 50;
export const RADIUS_STEP_KM = 5;
export const DEFAULT_RADIUS_KM = 10;

export function activeFilterCount(f: NearFilters): number {
  return (f.radiusKm !== null ? 1 : 0) + (f.status !== 'all' ? 1 : 0);
}

/** `?radius_km=` from a URL; anything that is not a positive number means Auto. */
export function parseRadiusKm(value: string | null): number | null {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : null;
}

/** `?open=open|closed` from a URL; anything else means all shops. */
export function parseStatusFilter(value: string | null): ShopStatusFilter {
  return value === 'open' || value === 'closed' ? value : 'all';
}

/** The extra filters on the search screen (the ones that used to be in the filter drawer, without Department). */
export interface MoreFilters {
  minPrice: string;
  maxPrice: string;
  minRating: string;
  district: string;
  /** price_asc | price_desc | '' */
  sortBy: string;
}

export const DEFAULT_MORE_FILTERS: MoreFilters = { minPrice: '', maxPrice: '', minRating: '', district: '', sortBy: '' };

export type AllFilters = NearFilters & MoreFilters;

export const DEFAULT_ALL_FILTERS: AllFilters = { ...DEFAULT_NEAR_FILTERS, ...DEFAULT_MORE_FILTERS };

/** How many filters are on, for the dot on the filter icon. */
export function countAllFilters(f: NearFilters & Partial<MoreFilters>): number {
  return activeFilterCount(f) + (f.minPrice || f.maxPrice || f.sortBy ? 1 : 0) + (f.minRating ? 1 : 0) + (f.district ? 1 : 0);
}
