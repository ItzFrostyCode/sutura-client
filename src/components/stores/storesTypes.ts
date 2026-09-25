import { type OperatingHours } from '@/lib/storeStatus';

export interface StoreResult {
  id: number;
  slug: string;
  name: string;
  logo_path: string | null;
  banner_path: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  branches: { city: string | null; name: string }[];
  operating_hours?: OperatingHours | string | null;
}

export const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
];

// Davao City's 8 administrative districts
export const DISTRICTS = ['Poblacion', 'Talomo', 'Buhangin', 'Agdao', 'Toril', 'Bunawan', 'Calinan', 'Tugbok'];

export function groupStoresByLetter(stores: StoreResult[]): [string, StoreResult[]][] {
  const groups = new Map<string, StoreResult[]>();
  for (const store of stores) {
    const letter = store.name.trim().charAt(0).toUpperCase() || '#';
    const bucket = groups.get(letter);
    if (bucket) bucket.push(store);
    else groups.set(letter, [store]);
  }
  return Array.from(groups.entries());
}
