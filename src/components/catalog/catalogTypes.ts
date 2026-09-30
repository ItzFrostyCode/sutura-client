export interface CatalogItemResponse {
  id: number;
  name: string;
  price: number;
  service_id?: number | null;
  estimated_days?: number | null;
  estimated_days_max?: number | null;
  material?: string;
  color?: string;
  fabric_image_url?: string;
  sizes?: string[] | null;
  description?: string;
  features?: string;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  measurement_guide?: string;
  care_instructions?: string;
  garment_type?: string;
  department?: string | null;
  subcategory?: string | null;
  garment_structure?: string | null;
  images: { id: number; image_url: string; view_angle?: string; is_primary: number }[];
  external_gallery_url?: string;
  is_active?: boolean;
}

// One extra Specification row: `text` is the first column (label), `value`
// the second. Older designs saved single-string bullets — those load as a
// label with an empty value.
export interface BulletItem {
  id: string;
  text: string;
  value?: string;
}

export interface ImageItem {
  id: string;
  url: string;
  angle: string;
  is_primary: boolean;
  uploading?: boolean;
}

// A color the shop owner can actually tailor this design in. No "available/
// unavailable" status field — a made-to-order tailoring shop has no stock
// to run out of, so a color is either offered (present in this list) or
// not (removed from it); see CatalogColorEditor.tsx.
export interface ColorItem {
  id: string;
  name: string;
  image_url: string;
  uploading?: boolean;
}

export interface CatalogFormData {
  name: string;
  price: string;
  service_id: string;
  estimated_days: string;
  estimated_days_max: string;
  material: string;
  fabric_image_url: string;
  description: string;
  care_instructions: string;
  measurement_guide: string;
  garment_type: string;
  department: string;
  subcategory: string;
  garment_structure: string;
  sizes: string[];
  external_gallery_url: string;
  is_active: boolean;
}
