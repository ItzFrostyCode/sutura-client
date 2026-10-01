import type { RequirementFields } from '@/components/jobs/requirements';


export interface CatalogImage {
  id: number;
  image_url: string;
  view_angle?: string;
  is_primary: boolean;
}

export interface CatalogReview {
  id: number;
  rating: number;
  comment?: string;
  reply?: string;
  created_at: string;
  user?: { id: number; name: string };
}

export interface ConnectedOrder {
  id: number;
  order_number?: string;
  type?: string;
  intake_channel?: 'walk_in' | 'online' | string | null;
  selected_size?: string | null;
  total_amount: string | number;
  discount_amount?: string | number | null;
  balance?: string | number | null;
  payment_status?: string;
  status?: string;
  created_at: string;
  customer?: { id: number; name: string; phone?: string; email?: string } | null;
}

export interface OtherCatalogOption {
  id: number;
  name: string;
  price: string | number;
  material?: string;
  images?: CatalogImage[];
}

export interface DetailedCatalogItem extends RequirementFields {
  id: number;
  name: string;
  price: string | number;
  estimated_days?: number | null;
  estimated_days_max?: number | null;
  material?: string;
  color?: string;
  fabric_image_url?: string | null;
  sizes?: string[] | null;
  description?: string | null;
  garment_type?: string | null;
  department?: string | null;
  subcategory?: string | null;
  garment_structure?: string | null;
  measurement_guide?: string | null;
  /** Owner's Appointment Configuration for this design (null = store defaults). */
  service_id?: number | null;
  service?: { id: number; name: string } | null;
  listing_type?: string;
  is_active?: boolean;
  images?: CatalogImage[];
  views_count?: number;
  saves_count?: number;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  features?: unknown;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  care_instructions?: unknown;
  external_gallery_url?: string | null;
  total_revenue?: number;
  order_count?: number;
  catalog_orders_count?: number;
  job_orders_count?: number;
  reviews?: CatalogReview[];
  catalog_orders?: ConnectedOrder[];
  job_orders?: ConnectedOrder[];
  recommendations?: {
    id: number;
    recommended_item_id?: number;
    recommendation_type?: string;
    recommended_item?: {
      id: number;
      name: string;
      price: string | number;
      images?: CatalogImage[];
    };
  }[];
}
