import { deriveTiersFromService, type PricingTierInput, type Service, type ServiceField, type ServiceType } from '../serviceHelpers';
import { emptySizeChart, type SizeChartValue } from '@/components/shared/SizeChartEditor';
import { emptyRequirementsDraft, requirementsPayload, requirementsToDraft, validateRequirements, type RequirementsDraft } from '@/components/requirements/requirementsDraft';
import type { PublicService } from '@/components/store-storefront/types';

export type ServiceSection = 'photo' | 'info' | 'spec' | 'chart' | 'description' | 'booking' | 'requirements';

// Everything a section can change, held as strings / plain values while editing.
export interface ServiceDraft {
  name: string;
  description: string;
  base_price: string;
  estimated_days: string;
  estimated_days_max: string;
  turnaround_depends: boolean;
  min_order_qty: string;
  service_category: string;
  service_leaf_type: string;
  service_types: ServiceType[];
  tiers: PricingTierInput[];
  image_url: string;
  sizeChart: SizeChartValue;
  custom_fields: ServiceField[];
  roster_fields: ServiceField[];
  requirements: RequirementsDraft;
}

export function toDraft(service: Service): ServiceDraft {
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    base_price: service.base_price != null ? String(Number(service.base_price)) : '',
    estimated_days: service.estimated_days != null ? String(service.estimated_days) : '',
    estimated_days_max: service.estimated_days_max != null ? String(service.estimated_days_max) : '',
    turnaround_depends: service.estimated_days == null,
    min_order_qty: service.min_order_qty != null ? String(service.min_order_qty) : '1',
    service_category: service.service_category ?? '',
    service_leaf_type: service.service_leaf_type ?? '',
    service_types: service.service_types ?? [],
    tiers: deriveTiersFromService(service),
    image_url: service.image_url ?? '',
    sizeChart: {
      image_url: service.size_chart_image_url ?? null,
      columns: service.size_chart_columns ?? [],
      rows: service.size_chart_rows ?? [],
    },
    custom_fields: service.custom_fields ?? [],
    roster_fields: service.roster_fields ?? [],
    requirements: requirementsToDraft(service),
  } satisfies ServiceDraft;
}

export const emptyServiceDraft = (): ServiceDraft => ({
  name: '', description: '', base_price: '', estimated_days: '', estimated_days_max: '', turnaround_depends: false, min_order_qty: '1',
  service_category: '', service_leaf_type: '', service_types: [], tiers: [{ label: '', amount: '' }],
  image_url: '', sizeChart: emptySizeChart, custom_fields: [], roster_fields: [], requirements: emptyRequirementsDraft(),
});

// Shared by the edit boxes and the create steps, so "required" means the same in both.
export function validateSection(section: ServiceSection, d: ServiceDraft): string | null {
  if (section === 'info') {
    if (!d.name.trim()) return 'The service needs a name.';
    if (!d.turnaround_depends) {
      if (!d.estimated_days || Number(d.estimated_days) < 1) return 'Enter the turnaround time (from days), or choose "It depends".';
      const from = Number(d.estimated_days);
      if (d.estimated_days_max !== '' && Number(d.estimated_days_max) <= from) return `The "to" days must be ${from + 1} or higher — or leave it blank.`;
    }
  }
  if (section === 'spec') {
    if (!d.service_category) return 'Pick a category.';
    if (d.tiers.every((t) => t.label.trim() === '')) return 'Add at least one priced item.';
  }
  if (section === 'requirements') return validateRequirements(d.requirements);
  return null;
}

export const emptyDraftChart = emptySizeChart;

// The update endpoint validates the whole service, so every save sends the
// full record: what this section changed (from the draft) on top of what is
// already saved. Sale price is left out on purpose — it has its own endpoint.
export function buildServicePayload(service: Service | null, draft: ServiceDraft, isActive = service?.is_active ?? true) {
  const tiers = draft.tiers
    .filter((t) => t.label.trim() !== '')
    .map((t) => ({ label: t.label.trim(), amount: t.amount.trim() === '' ? null : Number.parseFloat(t.amount) }));

  return {
    name: draft.name.trim(),
    description: draft.description || null,
    categories: service?.categories ?? [],
    service_types: draft.service_types,
    service_category: draft.service_category || null,
    service_leaf_type: draft.service_leaf_type || null,
    base_price: draft.base_price.trim() === '' ? null : Number.parseFloat(draft.base_price),
    estimated_days: draft.turnaround_depends || draft.estimated_days.trim() === '' ? null : Number.parseInt(draft.estimated_days, 10),
    estimated_days_max: draft.turnaround_depends || draft.estimated_days_max.trim() === '' ? null : Number.parseInt(draft.estimated_days_max, 10),
    min_order_qty: Number.parseInt(draft.min_order_qty, 10) || 1,
    custom_fields: draft.custom_fields.filter((f) => f.label.trim() !== ''),
    roster_fields: draft.service_types.includes('bulk_sublimation') ? draft.roster_fields : [],
    is_active: isActive,
    image_url: draft.image_url || null,
    size_chart_image_url: draft.sizeChart.image_url,
    size_chart_columns: draft.sizeChart.columns.length > 0 ? draft.sizeChart.columns : null,
    size_chart_rows: draft.sizeChart.rows.length > 0 ? draft.sizeChart.rows : null,
    pricing_tiers: tiers,
    ...requirementsPayload(draft.requirements),
  };
}

const SECTION_FIELDS: Record<ServiceSection, (keyof ServiceDraft)[]> = {
  photo: ['image_url'],
  info: ['name', 'base_price', 'estimated_days', 'estimated_days_max', 'turnaround_depends', 'min_order_qty'],
  spec: ['service_category', 'service_leaf_type', 'service_types', 'tiers'],
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
    pricing: service.pricing?.map((p) => ({ id: p.id, label: p.label, amount: p.amount })),
  } as unknown as PublicService;
}
