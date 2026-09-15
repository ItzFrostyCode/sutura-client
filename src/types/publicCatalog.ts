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
  estimated_days: number | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  order_count: number;
  images: CatalogImageResult[];
  shop: { name: string; slug: string } | null;
}
