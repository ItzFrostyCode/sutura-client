export interface CatalogItemImage {
  id: number;
  image_url: string;
  view_angle: string;
  is_primary: boolean;
}

export interface RecommendedItem {
  id: number;
  name: string;
  price: string | number;
  images?: CatalogItemImage[];
}

export interface Recommendation {
  recommendedItem?: RecommendedItem;
}

export interface CatalogItemReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { name: string } | null;
}

export interface StoreBranch {
  id: number;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

export interface CatalogItem {
  id: number;
  name: string;
  price: string | number;
  estimated_days?: number | null;
  description?: string;
  material?: string;
  color?: string;
  garment_type?: string;
  sizes?: string[] | null;
  features?: string[] | { bullets: string[]; image_url: string };
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  care_instructions?: string;
  images: CatalogItemImage[];
  fabric_image_url?: string | null;
  recommendations?: Recommendation[];
  external_gallery_url?: string;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  store?: {
    id: number;
    name: string;
    slug: string;
    logo_path: string | null;
    reviews_avg_rating?: number | null;
    reviews_count?: number;
    catalog_items_count?: number;
    services_count?: number;
    branches?: StoreBranch[];
  } | null;
  service?: {
    id: number;
    name: string;
    service_types?: string[];
    min_order_qty?: number;
  } | null;
  reviews?: CatalogItemReview[];
}

export interface MapBranch {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
}
