import type { RequirementFields } from '@/components/jobs/requirements';
import { Scissors, Users, Sparkles, Wrench, type LucideIcon } from 'lucide-react';
import type { SizeChartRow } from '@/components/shared/SizeChartEditor';
import { categoryOfGarment } from '@/lib/garmentTaxonomy';

export type { SizeChartRow };

export interface ServicePricing {
  id: number;
  service_id: number;
  label: string;
  amount: string;
}

export interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

export type ServiceType = 'custom_tailoring' | 'bulk_sublimation' | 'fashion_bridal' | 'alteration_repair';

export const SERVICE_TYPES: { value: ServiceType; label: string; hint: string }[] = [
  { value: 'custom_tailoring', label: 'Custom Tailoring & Bespoke', hint: 'Measurement-driven made-to-order garments' },
  { value: 'bulk_sublimation', label: 'Bulk / Sublimation Printing', hint: 'Team jerseys, corporate & school uniforms — enables team roster ordering' },
  { value: 'fashion_bridal', label: 'Fashion & Bridal', hint: 'Gowns, barong, Filipiniana — supports two-fitting scheduling' },
  { value: 'alteration_repair', label: 'Alterations & Repairs', hint: 'Resizing, repairs, hemming — requires pre-existing damage notes' },
];

// What each canonical category means for order handling. The category already says
// what the service is, so the "how it works" flag is derived from it, not asked twice.
export const CATEGORY_HANDLING: Record<string, { types: ServiceType[]; note: string }> = {
  custom_tailoring:        { types: ['custom_tailoring'],  note: 'Made to measure — customers are measured and fitted before the garment is finished.' },
  alterations_repairs:     { types: ['alteration_repair'], note: 'Repairs and resizing — customers describe the damage or the change they need when ordering.' },
  uniform_production:      { types: ['bulk_sublimation'],  note: 'Bulk order — customers can submit a team roster with sizes.' },
  printing_sublimation:    { types: ['bulk_sublimation'],  note: 'Bulk order — customers can submit a team roster with sizes.' },
  custom_costume_creation: { types: ['custom_tailoring'],  note: 'Made to measure — customers are measured and fitted before the garment is finished.' },
  others:                  { types: ['custom_tailoring'],  note: 'Handled as a made-to-measure order.' },
};

// Shared icon + color per service_type, reused by both the Services catalog and Job
// Creation's conditional fields so a type reads the same everywhere in the app.
export const SERVICE_TYPE_META: Record<ServiceType, { icon: LucideIcon; text: string; bg: string; border: string }> = {
  custom_tailoring:  { icon: Scissors, text: 'text-taupe', bg: 'bg-taupe/10', border: 'border-taupe/20' },
  bulk_sublimation:  { icon: Users,    text: 'text-blue-700',  bg: 'bg-blue-50',      border: 'border-blue-200' },
  fashion_bridal:    { icon: Sparkles, text: 'text-rose-700',  bg: 'bg-rose-50',      border: 'border-rose-200' },
  alteration_repair: { icon: Wrench,   text: 'text-amber-700', bg: 'bg-amber-50',     border: 'border-amber-200' },
};

export interface Service extends RequirementFields {
  id: number;
  /** Locked by the shop's plan (over its limit; never deleted). Server: PlanLimits. */
  plan_locked_at?: string | null;
  name: string;
  description: string;
  categories: string[];
  service_types?: ServiceType[];
  // New canonical taxonomy fields (src/lib/canonicalTaxonomy.ts) — additive,
  // do not replace the free-text `categories` or the operational `service_types` above.
  service_category?: string | null;
  /** Storefront "Service Categories" chip (lib/serviceShowcase). */
  showcase_category?: string | null;
  service_leaf_type?: string | null;
  base_price: string | null;
  sale_price?: string | number | null;
  sale_percent?: number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  estimated_days: number | null;
  estimated_days_max?: number | null;
  min_order_qty?: number;
  /** Per-piece amount off when the customer brings their own fabric (null = none set). */
  own_fabric_deduction?: number | string | null;
  is_active: boolean;
  image_url?: string | null;
  size_chart_image_url?: string | null;
  size_chart_image_urls?: string[] | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: SizeChartRow[] | null;
  custom_fields?: ServiceField[] | null;
  // Extra per-person roster columns for a bulk Service (e.g. "Jersey
  // Number", "Position") — asked once PER ROSTER ROW, unlike custom_fields
  // above, which is asked once per whole booking/order.
  roster_fields?: ServiceField[] | null;
  pricing?: ServicePricing[];
  tags?: string[];
  // Owner-facing analytics fields — populated by ServiceController::index()'s
  // withCount/withSum aggregation, same discount-aware total_revenue formula
  // as CatalogItem's own (total_amount - balance - discount_amount).
  reviews_count?: number;
  reviews_avg_rating?: number | null;
  saves_count?: number;
  job_orders_count?: number;
  total_revenue?: number;

  capabilities?: string[] | null;
  catalog_items?: {
    id: number;
    name: string;
    price?: number | string | null;
    sale_price?: number | string | null;
    estimated_days?: number | null;
    material?: string | null;
    garment_type?: string | null;
    garment_category?: string | null;
    color?: string | null;
    description?: string | null;
    is_active?: boolean;
    apparel_review?: any;
    images?: { id?: number; image_url: string; is_primary?: boolean; view_angle?: string | null; sort_order?: number }[];
    reviews_avg_rating?: number | null;
    reviews_count?: number;
    order_count?: number;
    saves_count?: number;
    pricing?: any;
  }[];
  garment_types?: string[] | null;
  price_display?: PriceDisplay;
  reviews?: {
    id: number;
    rating: number;
    created_at: string;
    user: { id: number; name: string; profile_picture: string | null } | null;
  }[];
  rush_available?: boolean | null;
  rush_fee_mode?: 'percent' | 'per_piece' | null;
  rush_fee_per_piece?: string | number | null;
  rush_fee_percent?: string | number | null;
  status?: ServiceStatus;
  /** How many designs use this service (dashboard list). */
  catalog_items_count?: number;
}

export interface PricingTierInput {
  label: string;
  amount: string;

  covers?: OptionCovers | '';
  sold_as?: OptionSoldAs | '';
}

/**
 * A service's priced line items live in `pricing`, but older/auto-populated
 * services may only have `tags` (no price yet) — fall back to those so the
 * edit form always has something to show instead of an empty required list.
 */
export function deriveTiersFromService(service: Service): PricingTierInput[] {
  if (service.pricing && service.pricing.length > 0) {
    return service.pricing.map(p => ({ label: p.label, amount: p.amount ? String(Number(p.amount)) : '' }));
  }
  return (service.tags || []).map(tag => ({ label: tag, amount: '' }));
}

export interface ServicePackage extends RequirementFields {
  id: number;
  name: string;
  description: string | null;
  image_url?: string | null;
  service_category?: string | null;
  job_orders_count?: number;
  total_revenue?: number;
  bundle_price: string | null;
  is_active: boolean;
  services: Service[];
}

export const SERVICE_CATEGORIES = [
  { group: 'Formal & Cultural Wear', items: [
    'Barong Tagalog Tailoring',
    'Filipiniana & Formal Dressmaking',
    'Gown & Evening Wear Designing',
    'Suit & Tuxedo Tailoring',
    'Custom Bridal Tailoring',
  ]},
  { group: 'Custom Apparel, Printing & Embroidery', items: [
    'Custom Jersey Printing',
    'Uniform Sublimation Printing',
    'Corporate & Team Uniforms',
    'Custom T-shirt Printing',
    'Embroidered Logos & Team Names',
    'Monogramming & Personalization',
    'Custom Patch Application',
  ]},
  { group: 'Institutional & Uniform Wear', items: [
    'School Uniforms',
    'Organization / Fraternity Uniforms',
    'Government / LGU Uniforms',
  ]},
  { group: 'Religious & Ceremonial Wear', items: [
    'Religious Vestments & Robes',
    'Choir Robes',
    'Ceremonial Sashes & Regalia',
  ]},
  { group: 'Costume & Character Wear', items: [
    'Halloween / Cosplay Costumes',
    'Theatrical / Stage Costumes',
    'Mascot & Character Suits',
  ]},
  { group: 'Specialty & Novelty Wear', items: [
    'Pet & Animal Costumes',
    'Mannequin & Display Wear',
  ]},
  { group: 'Alterations & Adjustments', items: [
    'General Clothing Alterations',
    'Gown & Suit Sizing Adjustment',
    'Hemming & Sleeve Shortening',
  ]},
  { group: 'Design & Consultation', items: [
    'Design Consultation',
    'Pattern & Layout Design',
  ]},
  { group: 'Other', items: ['Other / Custom Category'] },
];

// From 38c0962 (merge with Bongo's Sutura_Client).
/** What an option covers, and what one ordered unit of it is. Both are separate settings; null = not configured (as before: no coverage implied, one unit = one garment). */
export type OptionCovers = 'top' | 'bottom' | 'both';

// From 38c0962 (merge with Bongo's Sutura_Client).
export type PriceDisplay = 'fixed' | 'starting' | 'quotation';

// From 38c0962 (merge with Bongo's Sutura_Client).
export type ServiceStatus = 'draft' | 'published' | 'unpublished' | 'archived';

// From 38c0962 (merge with Bongo's Sutura_Client).
export type OptionSoldAs = 'garment' | 'set';

// From 38c0962 (merge with Bongo's Sutura_Client).
export function deriveOrderTypes(group: string, capabilities: string[], garments: string[]): ServiceType[] {
  if (group === 'alterations_repairs') return ['alteration_repair'];
  if (group === 'uniform_production') return [capabilities.includes('bulk_orders') ? 'bulk_sublimation' : 'custom_tailoring'];
  if (group === 'custom_tailoring') {
    return [garments.some((g) => BRIDAL_CATEGORIES.includes(categoryOfGarment(g) ?? '')) ? 'fashion_bridal' : 'custom_tailoring'];
  }
  return ['custom_tailoring'];
}

// From 38c0962 (merge with Bongo's Sutura_Client).
const BRIDAL_CATEGORIES = ['barong', 'traditional', 'dresses_gowns'];

// From 38c0962 (merge with Bongo's Sutura_Client).
export const STATUS_LABEL: Record<ServiceStatus, string> = { draft: 'Draft', published: 'Published', unpublished: 'Unpublished', archived: 'Archived' };
