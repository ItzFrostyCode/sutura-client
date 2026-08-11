export interface CatalogItemResponse {
  id: number;
  name: string;
  price: number;
  estimated_days?: number | null;
  material?: string;
  color?: string;
  fabric_image_url?: string;
  sizes?: string[] | null;
  description?: string;
  features?: string;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  care_instructions?: string;
  garment_type?: string;
  images: { id: number; image_url: string; view_angle?: string; is_primary: number }[];
  external_gallery_url?: string;
  is_active?: boolean;
}

export interface BulletItem {
  id: string;
  text: string;
}

export interface ImageItem {
  id: string;
  url: string;
  angle: string;
  is_primary: boolean;
  uploading?: boolean;
}

export interface CatalogFormData {
  name: string;
  price: string;
  estimated_days: string;
  material: string;
  color: string;
  fabric_image_url: string;
  description: string;
  care_instructions: string;
  garment_type: string;
  sizes: string[];
  external_gallery_url: string;
  is_active: boolean;
}
