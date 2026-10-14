import type { OperatingHours } from '@/lib/storeStatus';
import { DAVAO_DISTRICTS } from '@/lib/davaoLocations';

// All 11 Davao City districts — one list for the whole app (src/lib/davaoLocations.ts).
export const DISTRICTS: string[] = [...DAVAO_DISTRICTS];
export const DAVAO_CENTER: [number, number] = [7.0731, 125.6128];

export interface StoreApiBranch {
  id: number;
  name: string;
  is_main: boolean;
  address: string | null;
  city: string | null;
  landmark: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

export interface StoreApiResult {
  slug: string;
  name: string;
  logo_path: string | null;
  banner_path?: string | null;
  reviews_avg_rating?: number | string | null;
  reviews_count?: number;
  specializations?: string[] | null;
  operating_hours?: OperatingHours | string | null;
  branches: StoreApiBranch[];
}
