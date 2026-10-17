import type { OperatingHours } from '@/lib/storeStatus';
import type { DesignPricing } from '@/lib/designPricing';

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
    /** Server-worked price (lib/designPricing). */
    pricing?: DesignPricing | null;
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
    /** One of the 4 services (garmentTaxonomy SERVICE_GROUPS) — "alterations_repairs" = the shop alters & repairs. */
    service_category?: string | null;
    garment_types?: string[] | null;
    capabilities?: string[] | null;
    reviews_count?: number | null;
    reviews_avg_rating?: number | null;
    orders_count?: number | null;
  }[];
  matching_items_count?: number | null;
  catalog_items_count?: number | null;
  services_count?: number | null;
  /** Only with a search: the shop's services the search is about (the service or one of its designs matches). */
  matching_service_ids?: number[];
}

export interface SearchServiceResult {
  id: number;
  name: string;
  category?: string | null;
  service_type?: string | null;
  service_category?: string | null;
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

export const FILTER_TABS = [
  { key: 'specialization', label: 'Specialty' },
  { key: 'price', label: 'Price' },
  { key: 'rating', label: 'Rating' },
] as const;

export type FilterTabKey = typeof FILTER_TABS[number]['key'];

export type SearchActiveTab = 'all' | 'store' | 'services' | 'showroom';
