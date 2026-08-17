import { Scissors, Users, Sparkles, Wrench, type LucideIcon } from 'lucide-react';
import type { SizeChartRow } from '@/components/shared/SizeChartEditor';

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
  { value: 'fashion_bridal', label: 'Fashion & Bridal', hint: 'Gowns, barong, Filipiniana — supports two-fitting scheduling & rentals' },
  { value: 'alteration_repair', label: 'Alterations & Repairs', hint: 'Resizing, repairs, hemming — requires pre-existing damage notes' },
];

// Shared icon + color per service_type, reused by both the Services catalog and Job
// Creation's conditional fields so a type reads the same everywhere in the app.
export const SERVICE_TYPE_META: Record<ServiceType, { icon: LucideIcon; text: string; bg: string; border: string }> = {
  custom_tailoring:  { icon: Scissors, text: 'text-taupe', bg: 'bg-taupe/10', border: 'border-taupe/20' },
  bulk_sublimation:  { icon: Users,    text: 'text-blue-700',  bg: 'bg-blue-50',      border: 'border-blue-200' },
  fashion_bridal:    { icon: Sparkles, text: 'text-rose-700',  bg: 'bg-rose-50',      border: 'border-rose-200' },
  alteration_repair: { icon: Wrench,   text: 'text-amber-700', bg: 'bg-amber-50',     border: 'border-amber-200' },
};

export interface Service {
  id: number;
  name: string;
  description: string;
  categories: string[];
  service_types?: ServiceType[];
  base_price: string | null;
  sale_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  estimated_days: number;
  min_order_qty?: number;
  is_active: boolean;
  image_url?: string | null;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: SizeChartRow[] | null;
  custom_fields?: ServiceField[] | null;
  pricing?: ServicePricing[];
  tags?: string[];
}

export interface PricingTierInput {
  label: string;
  amount: string;
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

export interface ServicePackage {
  id: number;
  name: string;
  description: string | null;
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
