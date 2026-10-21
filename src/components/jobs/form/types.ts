export interface CustomerData {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  profile_picture?: string | null;
  is_trusted?: boolean;
}

export interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface ServiceData {
  id: number;
  name: string;
  category?: string;
  // service_type (singular) is the legacy column — StoreServiceRequest only
  // ever writes service_types (plural) now, so service_type goes stale on
  // any service created/edited since that migration. Always prefer
  // service_types; service_type is read only as a fallback for an older,
  // never-since-edited row. See jobHelpers.tsx's serviceHasType().
  service_type?: 'custom_tailoring' | 'bulk_sublimation' | 'fashion_bridal' | 'alteration_repair' | null;
  service_types?: string[] | null;
  /** One of the 4 approved service groups (lib/garmentTaxonomy SERVICE_GROUPS). */
  service_category?: string | null;
  /** Garments it works on; empty = any garment. */
  garment_types?: string[] | null;
  /** Tasks it offers (capability slugs of its group). */
  capabilities?: string[] | null;
  base_price?: string | number;
  image_url?: string | null;
  reviews_avg_rating?: number | string | null;
  reviews_count?: number | null;
  orders_count?: number | null;
  saves_count?: number | null;
  min_order_qty?: number;
  measurement_requirement?: 'none' | 'existing' | 'shop' | null;
  custom_fields?: ServiceField[] | null;
  /** Asked per person on a team order, next to name and size (e.g. a position). */
  roster_fields?: ServiceField[] | null;
  /** The sizes on the service's size chart, when it has one. */
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  size_chart_image_url?: string | null;
  tags?: string[];
  estimated_days?: number | null;
  estimated_days_max?: number | null;
}

export interface StaffData {
  id: number;
  user: {
    id: number;
    name: string;
  };
  role: string;
  additional_roles?: string[] | null;
}

export interface CustomerMeasurement {
  id: number;
  profile_name: string;
  updated_at: string;
  metrics?: Record<string, string | undefined>;
  notes?: string | null;
  superseded_at?: string | null;
  version?: number;
  appointment_id?: number | null;
  service_id?: number | null;
  catalog_item_id?: number | null;
  service?: { id: number; name: string } | null;
  catalog_item?: { id: number; name: string } | null;
  photo_urls?: string[] | null;
  status?: 'finalized' | 'pending_fitting';
}

export type MeasurementSourceMode = 'existing' | 'record_now' | 'standard_size' | 'none';

export interface InlineMeasurementData {
  id?: string;
  profile_name: string;
  measurement_area: 'top' | 'bottom' | 'both';
  metrics: Record<string, string>;
  top_columns: string[];
  bottom_columns: string[];
  notes: string;
  photo_urls: string[];
}

/** One person on a team order. Values are keyed by the team table's column keys (player_name, print_name, number, size, …). */
export interface RosterMember {
  id: string;
  [key: string]: string;
}

/** Another service the customer asked for at the same visit: it becomes its own linked order. */
export interface ExtraService {
  key: string;
  service_id: string;
  catalog_item_id: string;
  quantity: string;
  /** Typed price; empty = the service's own price × quantity. */
  price: string;
}

export interface JobCreateFormData {
  customer_id: string;
  service_id: string;
  measurement_id: string;
  // Same design, several identical pieces for ONE person/measurement
  // profile — distinct from a bulk order's roster (different people,
  // different sizes). Meaningless for a bulk order; hidden there.
  quantity: string;
  /** Price before rush fee and discount. null until the owner types one; then the suggestion from the service / design is used. */
  price: string | null;
  downpayment: string;
  /** null until the owner picks one; then the service's turnaround is used. */
  due_date: string | null;
  notes: string;
  is_rush: boolean;
  rush_fee: string;
  material_source: 'store_supplied' | 'customer_supplied';
  /** Garment slug (lib/garmentTaxonomy) or a typed-in name for "Other garment". */
  garment_type: string;
  discount_mode: 'fixed' | 'percent';
  discount_value: string;
  discount_reason: string;
  /** Where the design comes from, a link to the customer's file, and what was said in the consultation. */
  design_source: import('@/lib/designSource').DesignSource | null;
  design_link: string;
  consultation_notes: string;
}
