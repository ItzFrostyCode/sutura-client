export interface StoreBranch {
  id: number;
  slug?: string;
  name: string;
  address: string;
  city: string;
  district?: string | null;
  contact_number?: string | null;
  operating_hours?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  guide_image_url?: string | null;
  is_main?: boolean | number;
  landmark?: string | null;
  status?: string;
}

export interface PublicService {
  id: number;
  name: string;
  description?: string;
  category?: string;
  service_type?: string;
  categories?: string[];
  service_types?: string[];
  base_price: string;
  sale_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  estimated_days: number;
  is_active: boolean;
  image_url?: string | null;
  reviews_count?: number | null;
  reviews_avg_rating?: number | null;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  custom_fields?: {
    name: string;
    label: string;
    type: 'short_text' | 'number' | 'dropdown' | 'single_choice' | 'multi_select';
    required?: boolean;
    options?: string[];
  }[];
}

export interface PublicServicePackage {
  id: number;
  name: string;
  description: string | null;
  bundle_price: string | null;
  services: { id: number; name: string; base_price: string | null }[];
}

export interface CatalogItemImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  view_angle?: string | null;
}

export interface CatalogListItem {
  id: number;
  name: string;
  price: string;
  estimated_days?: number | null;
  material: string;
  garment_type?: string | null;
  color?: string | null;
  description?: string | null;
  images: CatalogItemImage[];
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  fabric_image_url?: string | null;
}

export interface PublicStorePost {
  id: number;
  image_urls: string[];
  caption: string;
  service_id: number | null;
  service?: { id: number; name: string } | null;
  created_at: string;
}

export interface StorefrontReview {
  id: number;
  user: { id: number; name: string };
  rating: number;
  comment: string | null;
  reply: string | null;
  is_featured: boolean;
  created_at: string;
}

export interface StoreProfile {
  id: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  logo_path: string;
  banner_path?: string | null;
  social_links: { label: string; url: string }[];
  reviews_avg_rating: number | null;
  reviews_count: number;
  my_review?: { id?: number; rating: number; comment?: string | null } | null;
  district?: string;
  specializations?: string[];
  business_type?: string | null;
  branches?: StoreBranch[];
  owner?: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string | null;
  };
  active_special_hours?: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
    announcement_image_url: string | null;
  } | null;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }>;
  special_hours?: Array<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
    announcement_image_url: string | null;
  }>;
}

export interface PublicStoreProfilePageProps {
  readonly params: Promise<{
    readonly store_id: string;
  }>;
}

export type StorefrontTab =
  | 'about'
  | 'catalog'
  | 'locations'
  | 'reviews'
  | 'services'
  | 'home'
  | 'hours'
  | 'work';

export const PORTFOLIO_COLOR_OPTIONS = [
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Ivory', hex: '#FFFFF0' },
  { label: 'Cream', hex: '#FFFDD0' },
  { label: 'Beige', hex: '#D9CDB8' },
  { label: 'Black', hex: '#1A1A1A' },
  { label: 'Sky Blue', hex: '#7DD3FC' },
  { label: 'Light Blue', hex: '#93C5FD' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Royal Blue', hex: '#1D4ED8' },
  { label: 'Navy', hex: '#1E3A8A' },
  { label: 'Red', hex: '#EF4444' },
  { label: 'Crimson', hex: '#DC2626' },
  { label: 'Burgundy', hex: '#800020' },
  { label: 'Maroon', hex: '#800000' },
  { label: 'Pink', hex: '#F472B6' },
  { label: 'Blush', hex: '#DE5D83' },
  { label: 'Rose Gold', hex: '#B76E79' },
  { label: 'Peach', hex: '#FFDAB9' },
  { label: 'Gold', hex: '#EAB308' },
  { label: 'Champagne', hex: '#F7E7CE' },
  { label: 'Silver', hex: '#94A3B8' },
  { label: 'Gray', hex: '#6B7280' },
  { label: 'Emerald', hex: '#047857' },
  { label: 'Green', hex: '#22C55E' },
  { label: 'Olive', hex: '#556B2F' },
  { label: 'Sage', hex: '#9CAF88' },
  { label: 'Purple', hex: '#A855F7' },
  { label: 'Lavender', hex: '#E9D5FF' },
  { label: 'Brown', hex: '#78350F' },
  { label: 'Bronze', hex: '#CD7F32' },
];
