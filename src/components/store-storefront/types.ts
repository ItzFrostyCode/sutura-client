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
  landmark_image_url?: string | null;
  status?: string;
}

export interface PublicService {
  id: number;
  name: string;
    /** Fixed price, Starting price or Quotation required (B6-O11). */
    price_display?: 'fixed' | 'starting' | 'quotation' | null;
  description?: string;
  category?: string;
  service_type?: string;
  service_category?: string | null;
  categories?: string[];
  service_types?: string[];
  base_price: string;
  sale_price?: string | number | null;
  /** Services → Discount: the % off every price tier while the sale dates run. */
  sale_percent?: number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  estimated_days: number | null;
  estimated_days_max?: number | null;
  min_order_qty?: number | null;
  /** Per-piece amount off when the customer brings their own fabric (null = none set). */
  own_fabric_deduction?: number | string | null;
  /** What an online order asks of the customer: service setting, else the shop default. */
  order_requirements?: {
    measurement_requirement: 'none' | 'existing' | 'shop';
    fitting_requirement: 'none' | 'optional' | 'required';
    payment_policy: 'none' | 'full' | 'deposit' | 'custom';
    payment_policy_percent: number;
  };
  is_active: boolean;
  image_url?: string | null;
  reviews_count?: number | null;
  orders_count?: number | null;
  reviews_avg_rating?: number | null;
  saves_count?: number | null;
  // Star-only — no comment column exists on service_reviews (see the
  // backend's ServiceReview model docblock), unlike CatalogItemReview.
  reviews?: {
    id: number;
    rating: number;
    created_at: string;
    user: { id: number; name: string; profile_picture: string | null } | null;
  }[];
  size_chart_image_url?: string | null;
  /** Every Reference Chart image (size_chart_image_url is the first). */
  size_chart_image_urls?: string[] | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  // Per-item/per-job-type pricing (e.g. Alteration -> Pants Hemming ₱150,
  // Dress Alteration ₱300) — always present alongside base_price, never a
  // replacement for it; base_price stays the "starting at" headline figure.
  /** Options of the service. `covers` and `sold_as` are what the option covers and what one ordered unit is (null = not configured). */
  pricing?: { id: number; label: string; amount: string | number; covers?: 'top' | 'bottom' | 'both' | null; sold_as?: 'garment' | 'set' | null }[];
  /** Garments it works on (garmentTaxonomy slugs); empty on alterations / customization = any garment. */
  garment_types?: string[] | null;
  /** Tasks it offers (capability slugs of its service group). */
  capabilities?: string[] | null;
  /** Columns asked for every person on a group order (Jersey Number, Position…), set by the shop on the service. */
  roster_fields?: { id?: string; label: string; type?: string; required?: boolean }[] | null;
  custom_fields?: {
    name: string;
    label: string;
    type: 'short_text' | 'number' | 'dropdown' | 'single_choice' | 'multi_select';
    required?: boolean;
    options?: string[];
  }[];
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
  /** The service this design belongs to — designs are browsed from inside it. */
  service_id?: number | null;
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
  created_at: string;
}

export interface StoreProfile {
  id: number;
  name: string;
  slug: string;
  /** pending | approved | rejected | suspended: only an approved shop shows "Verified shop". */
  status?: string;
  description: string;
  address: string;
  city: string;
  province: string;
  landmark?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  phone: string;
  email: string;
  logo_path: string;
  banner_path?: string | null;
  social_links: { label: string; url: string }[];
  reviews_avg_rating: number | null;
  /** On Premium right now (server: PlanGate, ended subscriptions excluded) — the Premium mark on the page. */
  is_premium?: boolean;
  reviews_count: number;
  my_review?: { id?: number; rating: number } | null;
  district?: string;
  specializations?: string[];
  /** The shop's own services, listed with the standard ones. */
  custom_services?: string[] | null;
  /** Other locations listed at registration — display only, not bookable branches. */
  declared_branches?: { name: string; address: string }[] | null;
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
  gcash_number?: string | null;
  gcash_account_name?: string | null;
  gcash_qr_path?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_qr_path?: string | null;
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
