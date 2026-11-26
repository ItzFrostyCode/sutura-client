import { deriveOrderTypes, deriveTiersFromService, type PriceDisplay, type PricingTierInput, type Service, type ServiceField, type ServiceType } from '../serviceHelpers';
import { canonicalGarment } from '@/lib/garmentTaxonomy';
import { emptySizeChart, type SizeChartValue } from '@/components/shared/SizeChartEditor';
import { emptyRequirementsDraft, requirementsPayload, requirementsToDraft, validateRequirements, type RequirementsDraft } from '@/components/requirements/requirementsDraft';
import type { PublicService } from '@/components/store-storefront/types';

// The boxes of the service page, in Bongo's order: 1 Specification (Category, Service type, Pricing options),
// 2 Reference Chart, 3 Description, 4 Booking Form, 5 Requirements — plus the photo and the name/price/time box.
export type ServiceSection = 'photo' | 'info' | 'spec' | 'chart' | 'description' | 'booking' | 'requirements';

/** Rush for this service and the own-fabric deduction, as typed. */
export interface ServiceCharges {
  rush: 'shop' | 'none' | 'custom';
  rushMode: 'percent' | 'per_piece';
  rushPercent: string;
  rushPerPiece: string;
  ownFabric: string;
}

const num = (v: string | number | null | undefined) => (v == null || v === '' ? '' : String(Number(v)));

export function chargesFrom(service: Service | null): ServiceCharges {
  return {
    rush: service?.rush_available === false ? 'none' : service?.rush_available === true ? 'custom' : 'shop',
    rushMode: service?.rush_fee_mode === 'per_piece' ? 'per_piece' : 'percent',
    rushPercent: num(service?.rush_fee_percent),
    rushPerPiece: num(service?.rush_fee_per_piece),
    ownFabric: Number(service?.own_fabric_deduction) > 0 ? num(service?.own_fabric_deduction) : '',
  };
}

// Everything a section can change, held as strings / plain values while editing.
export interface ServiceDraft {
  name: string;
  description: string;
  base_price: string;
  /** Fixed price, Starting price or Quotation required (B6-O11). */
  price_display: PriceDisplay;
  estimated_days: string;
  estimated_days_max: string;
  turnaround_depends: boolean;
  min_order_qty: string;
  service_category: string;
  /** The storefront "Service Categories" chip it sits under (lib/serviceShowcase). */
  /** Worked out from the service type, capabilities and garments (deriveOrderTypes) — never ticked. */
  service_types: ServiceType[];
  /** Garments it works on (current slugs). */
  garment_types: string[];
  /** Tasks it offers (capabilities of the service type). */
  capabilities: string[];
  tiers: PricingTierInput[];
  /** What changes the price: rush (the shop's rule, none, or this service's own) and the own-fabric deduction. */
  charges: ServiceCharges;
  image_url: string;
  sizeChart: SizeChartValue;
  custom_fields: ServiceField[];
  roster_fields: ServiceField[];
  requirements: RequirementsDraft;
  /** The storefront "Service Categories" chip it sits under (Specification → Category). */
  showcase_category: string;
  /** Specification → Service type (the uniform type for a uniform service). */
  service_leaf_type: string;
}

function normalizeCustomFields(fields?: any[] | null): ServiceField[] {
  if (!Array.isArray(fields)) return [];
  const typeMap: Record<string, ServiceField['type']> = {
    short_text: 'text',
    text: 'text',
    number: 'number',
    dropdown: 'select',
    select: 'select',
    single_choice: 'select',
    checkbox: 'checkbox',
    radio: 'radio',
  };
  return fields.map((f, idx) => ({
    id: String(f.id ?? f.name ?? `f_${idx}_${Date.now().toString(36)}`),
    label: String(f.label ?? f.name ?? ''),
    type: typeMap[f.type] ?? 'text',
    required: Boolean(f.required),
    options: Array.isArray(f.options) ? f.options.map(String) : undefined,
  }));
}

function normalizeRosterFields(fields?: any[] | null): ServiceField[] {
  if (!Array.isArray(fields)) return [];
  return fields.map((f, idx) => ({
    id: String(f.id ?? `r_${idx}_${Date.now().toString(36)}`),
    label: String(f.label ?? ''),
    type: (f.type === 'number' || f.type === 'select') ? f.type : 'text',
    required: Boolean(f.required),
    options: Array.isArray(f.options) ? f.options.map(String) : undefined,
  }));
}

export function toDraft(service: Service): ServiceDraft {
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    base_price: service.base_price != null && Number(service.base_price) > 0 ? String(Number(service.base_price)) : '',
    price_display: service.price_display ?? (Number(service.base_price) > 0 || (service.pricing ?? []).some((p) => Number(p.amount) > 0) ? 'starting' : 'quotation'),
    estimated_days: service.estimated_days != null ? String(service.estimated_days) : '',
    estimated_days_max: service.estimated_days_max != null ? String(service.estimated_days_max) : '',
    turnaround_depends: service.estimated_days == null,
    min_order_qty: service.min_order_qty != null ? String(service.min_order_qty) : '1',
    service_category: service.service_category ?? '',
    service_types: service.service_types ?? [],
    // A garment from the list under its current slug; a name the shop typed under "Other garments" stays as typed.
    garment_types: Array.from(new Set((service.garment_types ?? []).map((g) => canonicalGarment(g) ?? g.trim()).filter(Boolean))),
    capabilities: service.capabilities ?? [],
    tiers: deriveTiersFromService(service),
    charges: chargesFrom(service),
    image_url: service.image_url ?? '',
    sizeChart: {
      image_url: service.size_chart_image_url ?? null,
      columns: service.size_chart_columns ?? [],
      rows: service.size_chart_rows ?? [],
    },
    custom_fields: normalizeCustomFields(service.custom_fields),
    roster_fields: normalizeRosterFields(service.roster_fields),
    requirements: requirementsToDraft(service),
    showcase_category: service.showcase_category ?? SHOWCASE_FOR[service.service_category ?? ''] ?? '',
    service_leaf_type: service.service_leaf_type ?? '',
  } satisfies ServiceDraft;
}

/** A service saved before it had a Category: the shop-page chip its kind of work belongs under. */
const SHOWCASE_FOR: Record<string, string> = {
  custom_tailoring: 'custom_tailoring',
  alterations_repairs: 'alterations_repairs',
  uniform_production: 'uniform',
  printing_sublimation: 'sports',
  garment_customization: 'embroidery',
};

export const emptyServiceDraft = (): ServiceDraft => ({
  name: '', description: '', base_price: '', price_display: 'starting', estimated_days: '', estimated_days_max: '', turnaround_depends: false, min_order_qty: '1',
  service_category: '', service_types: [], garment_types: [], capabilities: [],
  tiers: [{ label: '', amount: '', covers: '', sold_as: '' }],
  charges: chargesFrom(null),
  image_url: '', sizeChart: emptySizeChart, custom_fields: [], roster_fields: [], requirements: emptyRequirementsDraft(),
  showcase_category: '', service_leaf_type: '',
});

// Shared by the edit boxes and the create steps, so "required" means the same in both.
export function validateSection(section: ServiceSection, d: ServiceDraft): string | null {
  if (section === 'info') {
    if (!d.name.trim()) return 'The service needs a name.';
    if (d.price_display === 'fixed' && !(Number(d.base_price) > 0)) return 'A fixed price needs the price. Choose "Starting price" or "Quotation required" if it varies.';
    if (!d.turnaround_depends) {
      if (!d.estimated_days || Number(d.estimated_days) < 1) return 'Enter the turnaround time (from days), or choose "It depends".';
      const from = Number(d.estimated_days);
      if (d.estimated_days_max !== '' && Number(d.estimated_days_max) <= from) return `The "to" days must be ${from + 1} or higher — or leave it blank.`;
    }
  }
  if (section === 'spec') {
    if (!d.showcase_category || !d.service_category) return 'Pick a category.';
    // Customers narrow Uniform by its type, so a uniform service needs one.
    if (d.service_category === 'uniform_production' && !d.service_leaf_type) return 'Pick the uniform type.';
    if (d.tiers.every((t) => t.label.trim() === '')) return 'Add at least one priced item.';
    if (d.tiers.some((t) => t.amount.trim() !== '' && t.label.trim() === '')) return 'Enter a name for every price you entered.';
  }
  if (section === 'requirements') return validateRequirements(d.requirements);
  return null;
}

export const emptyDraftChart = emptySizeChart;

/** The order types this draft adds up to (same rule as the server). */
export function orderTypesOf(d: ServiceDraft): ServiceType[] {
  return d.service_category ? deriveOrderTypes(d.service_category, d.capabilities, d.garment_types) : d.service_types;
}

// The update endpoint validates the whole service, so every save sends the
// full record: what this section changed (from the draft) on top of what is
// already saved. Sale price is left out on purpose — it has its own endpoint.
export function buildServicePayload(service: Service | null, draft: ServiceDraft, isActive = service?.is_active ?? true, status?: 'draft' | 'published' | 'unpublished') {
  const tiers = draft.tiers
    .filter((t) => t.label.trim() !== '')
    .map((t) => ({
      label: t.label.trim(),
      amount: t.amount.trim() === '' || isNaN(Number(t.amount)) ? null : Number.parseFloat(t.amount),
      covers: t.covers || null,
      sold_as: t.sold_as || null,
    }));

  const validRows = (draft.sizeChart?.rows ?? []).filter((r) => r.size && r.size.trim() !== '');

  return {
    name: draft.name.trim(),
    description: draft.description || null,
    categories: service?.categories ?? [],
    // Worked out again on the server from the same three fields (Service::deriveOrderTypes).
    service_types: orderTypesOf(draft),
    service_category: draft.service_category || null,
    showcase_category: draft.showcase_category || null,
    service_leaf_type: draft.service_leaf_type || null,
    garment_types: draft.garment_types,
    capabilities: draft.capabilities,
    base_price: draft.base_price.trim() === '' || isNaN(Number(draft.base_price)) ? null : Number.parseFloat(draft.base_price),
    estimated_days: draft.turnaround_depends || draft.estimated_days.trim() === '' ? null : Number.parseInt(draft.estimated_days, 10),
    estimated_days_max: draft.turnaround_depends || draft.estimated_days_max.trim() === '' ? null : Number.parseInt(draft.estimated_days_max, 10),
    min_order_qty: Number.parseInt(draft.min_order_qty, 10) || 1,
    custom_fields: draft.custom_fields.filter((f) => (f.label || '').trim() !== ''),
    roster_fields: orderTypesOf(draft).includes('bulk_sublimation') ? draft.roster_fields : [],
    // `status` (lifecycle, S2) wins when given; otherwise the older is_active switch is mapped on the server.
    ...(status ? { status } : { is_active: isActive }),
    price_display: draft.price_display,
    image_url: draft.image_url || null,
    size_chart_image_url: draft.sizeChart?.image_url || null,
    size_chart_columns: (draft.sizeChart?.columns ?? []).length > 0 ? draft.sizeChart.columns.filter((c) => c.trim() !== '') : null,
    size_chart_rows: validRows.length > 0 ? validRows : null,
    pricing_tiers: tiers,
    ...chargesPayload(draft.charges),
    ...requirementsPayload(draft.requirements),
  };
}

/** Rush (null = the shop's rule, false = none, true = its own fee) and the own-fabric deduction, in the server's fields. */
export function chargesPayload(c: ServiceCharges) {
  const custom = c.rush === 'custom';
  return {
    rush_available: c.rush === 'shop' ? null : custom,
    rush_fee_mode: custom ? c.rushMode : null,
    rush_fee_percent: custom && c.rushMode === 'percent' ? Number(c.rushPercent) : null,
    rush_fee_per_piece: custom && c.rushMode === 'per_piece' ? Number(c.rushPerPiece) : null,
    own_fabric_deduction: c.ownFabric.trim() === '' ? null : Number(c.ownFabric),
  };
}

const SECTION_FIELDS: Record<ServiceSection, (keyof ServiceDraft)[]> = {
  photo: ['image_url'],
  info: ['name', 'base_price', 'price_display', 'estimated_days', 'estimated_days_max', 'turnaround_depends'],
  spec: ['showcase_category', 'service_category', 'service_leaf_type', 'service_types', 'tiers'],
  chart: ['sizeChart'],
  description: ['description'],
  booking: ['custom_fields', 'roster_fields'],
  requirements: ['requirements'],
};

export function sectionChanged(section: ServiceSection, a: ServiceDraft, b: ServiceDraft): boolean {
  return SECTION_FIELDS[section].some((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

// What the customer page's blocks expect (same fields, public shape).
export function toPublicService(service: Service): PublicService {
  return {
    ...service,
    base_price: service.base_price ?? '',
    description: service.description ?? undefined,
    reviews_avg_rating: service.reviews_avg_rating ?? null,
    reviews_count: service.reviews_count ?? 0,
    orders_count: service.job_orders_count ?? (service as any).orders_count ?? 0,
    saves_count: service.saves_count ?? 0,
    pricing: service.pricing?.map((p) => ({ id: p.id, label: p.label, amount: p.amount })),
  } as unknown as PublicService;
}
