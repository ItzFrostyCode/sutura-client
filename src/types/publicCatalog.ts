// Shared shape of GET /api/v1/public/catalog-items rows — used by both the
// landing page's Catalog Showroom and /search's results grid.
export interface CatalogImageResult {
  image_url: string;
  is_primary: boolean;
}

export interface CatalogItemResult {
  id: number;
  name: string;
  garment_type: string;
  price: number | null;
  material: string | null;
  color?: string | null;
  estimated_days: number | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  order_count: number;
  images: CatalogImageResult[];
  // Real column (catalog_items.fabric_image_url) — CatalogController's
  // publicShowroom() has no select()/$hidden restricting it, so it's
  // already present on every response; just never typed until now.
  fabric_image_url: string | null;
  distance_km?: number | null;
  store: {
    id?: number;
    name: string;
    slug: string;
    branches?: {
      id: number;
      name: string;
      is_main?: boolean;
      district?: string | null;
      city?: string | null;
      latitude?: number | string | null;
      longitude?: number | string | null;
    }[];
  } | null;
}
