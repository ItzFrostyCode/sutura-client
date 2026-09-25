import type { OperatingHours } from '@/lib/storeStatus';

export interface RelatedStore {
  id: number;
  slug: string;
  name: string;
  logo_path: string | null;
  banner_path?: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  distance_km?: number | null;
  subscription_plan?: string | null;
  is_featured?: boolean;
  operating_hours?: OperatingHours | null;
  owner?: { id: number; name: string } | null;
  branches?: {
    id: number;
    name: string;
    district: string | null;
    city: string | null;
    latitude: string | null;
    longitude: string | null;
    address?: string;
  }[];
  catalog_items?: {
    id: number;
    name: string;
    price: string | number;
    material?: string | null;
    garment_type?: string | null;
    fabric_image_url?: string | null;
    images?: { id: number; image_url: string; is_primary?: boolean }[];
  }[];
  matching_items_count?: number | null;
}

export interface SearchServiceResult {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  base_price: number | null;
  sale_price?: number | null;
  estimated_days?: number | null;
  image_url?: string | null;
  reviews_count?: number | null;
  reviews_avg_rating?: number | null;
  store?: {
    id: number;
    name: string;
    slug: string;
    logo_path?: string | null;
    banner_path?: string | null;
    operating_hours?: OperatingHours | null;
    subscription_plan?: string | null;
    is_featured?: boolean;
    owner?: { id: number; name: string } | null;
    branches?: {
      id: number;
      name: string;
      district: string | null;
      city: string | null;
      latitude: string | null;
      longitude: string | null;
      address?: string;
    }[];
  } | null;
}

export const DISTRICTS = [
  'Poblacion',
  'Talomo',
  'Buhangin',
  'Agdao',
  'Toril',
  'Bunawan',
  'Calinan',
  'Tugbok',
];

export const FILTER_TABS = [
  { key: 'specialization', label: 'Specialty' },
  { key: 'color', label: 'Color' },
  { key: 'district', label: 'Location' },
  { key: 'openNow', label: 'Hours' },
  { key: 'price', label: 'Price' },
  { key: 'rating', label: 'Rating' },
] as const;

export type FilterTabKey = typeof FILTER_TABS[number]['key'];

export type SearchActiveTab = 'all' | 'store' | 'services' | 'showroom';
