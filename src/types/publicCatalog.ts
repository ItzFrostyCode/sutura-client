import type { DesignPricing } from '@/lib/designPricing';

// Shared shape of GET /api/v1/public/catalog-items rows — used by both the
// landing page's Catalog Showroom and /search's results grid.
export interface CatalogImageResult {
  image_url: string;
  is_primary: boolean;
}

export interface CatalogItemResult {
  id: number;
  name: string;
  garment_type?: string | null;
  service_id?: number | null;
  service_name?: string | null;
  service?: { id: number; name: string } | null;
  price: number | string | null;
  /** Server-worked price (lib/designPricing): the service's price, plus any extra charge, or a quotation. */
  pricing?: DesignPricing | null;
  material: string | null;
  color?: string | null;
  description?: string | null;
  estimated_days: number | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  order_count?: number;
  saves_count?: number;
  images: CatalogImageResult[];
  // Real column (catalog_items.fabric_image_url) — CatalogController's
  // publicShowroom() has no select()/$hidden restricting it, so it's
  // already present on every response; just never typed until now.
  fabric_image_url?: string | null;
  distance_km?: number | null;
  store?: {
    id?: number;
    name: string;
    slug: string;
    branches?: {
      id: number;
      name: string;
      is_main?: boolean;
      district?: string | null;
      barangay?: string | null;
      city?: string | null;
      address?: string | null;
      latitude?: number | string | null;
      longitude?: number | string | null;
    }[];
  } | null;
}
