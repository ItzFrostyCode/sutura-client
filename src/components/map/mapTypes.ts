import type { OperatingHours } from '@/lib/storeStatus';

export const DISTRICTS = ['Poblacion', 'Talomo', 'Buhangin', 'Agdao', 'Toril', 'Bunawan', 'Calinan', 'Tugbok'];
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
  operating_hours?: OperatingHours | string | null;
  branches: StoreApiBranch[];
}
