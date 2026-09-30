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
  specializations?: string[];
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
  services?: {
    id: number;
    name: string;
    description?: string | null;
    base_price: string | number | null;
    sale_price?: string | number | null;
    estimated_days?: number | null;
  estimated_days_max?: number | null;
    image_url?: string | null;
    category?: string | null;
    service_type?: string | null;
    service_types?: string[] | null;
    reviews_count?: number | null;
    reviews_avg_rating?: number | null;
    orders_count?: number | null;
  }[];
  matching_items_count?: number | null;
  catalog_items_count?: number | null;
  services_count?: number | null;
}

export interface SearchServiceResult {
  id: number;
  name: string;
  category?: string | null;
  service_type?: string | null;
  service_category?: string | null;
  service_leaf_type?: string | null;
  description?: string | null;
  base_price: number | null;
  sale_price?: number | null;
  estimated_days?: number | null;
  estimated_days_max?: number | null;
  image_url?: string | null;
  reviews_count?: number | null;
  reviews_avg_rating?: number | null;
  orders_count?: number | null;
  store?: {
    id: number;
    name: string;
    slug: string;
    logo_path?: string | null;
    banner_path?: string | null;
    operating_hours?: OperatingHours | null;
    subscription_plan?: string | null;
    is_featured?: boolean;
    distance_km?: number | null;
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
  { key: 'price', label: 'Price' },
  { key: 'rating', label: 'Rating' },
  { key: 'district', label: 'Location' },
] as const;

export type FilterTabKey = typeof FILTER_TABS[number]['key'];

export type SearchActiveTab = 'all' | 'store' | 'services' | 'showroom';

/** A combo package in search results (GET /public/service-packages). */
export interface SearchPackageResult {
  id: number;
  name: string;
  description: string | null;
  service_category: string | null;
  image_url: string | null;
  bundle_price: string | null;
  reviews_count?: number;
  reviews_avg_rating?: number | null;
  services: { id: number; name: string; base_price: string | null }[];
  store: { id: number; name: string; slug: string; branches?: { district?: string | null; city?: string | null }[] } | null;
}
