import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import { serviceHasType } from '@/components/jobs/jobHelpers';
import {
  GARMENTS,
  GARMENT_CATEGORIES,
  canonicalGarment,
  categoryOfGarment,
  type GarmentCategory,
} from '@/lib/garmentTaxonomy';
import type { ServiceData } from './types';

const ANY_GARMENT_GROUPS = ['alterations_repairs', 'garment_customization'];

/**
 * The garments a service works on, as current slugs. null = any garment: only an alteration / customization service
 * with none ticked (the server's worksOnAnyGarment), or an old service with no group. Any other service with none
 * ticked works on nothing in particular, so it is not offered once a garment is picked.
 */
export function serviceGarments(service: ServiceData): string[] | null {
  // A garment from the list as its current slug; a name the shop typed under "Other garments" as typed.
  const list = (service.garment_types ?? []).map((g) => canonicalGarment(g) ?? g.trim()).filter(Boolean);
  if (list.length > 0) return list;
  return !service.service_category || ANY_GARMENT_GROUPS.includes(service.service_category) ? null : [];
}

export interface GarmentOption {
  id: string;
  label: string;
  /** Category name shown beside it, from the taxonomy. */
  group: string;
  /** True when one of the shop's services or designs is about it. */
  mine: boolean;
  /** What typing is matched against: name, category and the words customers use. */
  search: string;
}

export const CUSTOM_PREFIX = 'custom:';

/**
 * Every garment the form can offer, built from data: the whole taxonomy (so a garment or category added there shows up
 * with no change here), plus any name the shop typed on a design (an admin-approved one included). The garments the
 * shop's own services and designs are about come first.
 */
export function garmentOptions(services: ServiceData[], designs: CatalogItem[]): GarmentOption[] {
  const mine = new Set<string>();
  const custom = new Map<string, string>();
  services.forEach((s) => serviceGarments(s)?.forEach((g) => (GARMENTS[g] ? mine.add(g) : custom.set(g.toLowerCase(), g))));
  designs.forEach((d) => {
    const raw = d.garment_type?.trim();
    if (!raw) return;
    const slug = canonicalGarment(raw);
    if (slug) mine.add(slug);
    else custom.set(raw.toLowerCase(), raw);
  });

  const listed: GarmentOption[] = Object.keys(GARMENTS).map((slug) => {
    const g = GARMENTS[slug];
    const cat = GARMENT_CATEGORIES[g.category];
    return { id: slug, label: g.label, group: cat.label, mine: mine.has(slug), search: [g.label, cat.label, ...g.aliases, ...cat.aliases].join(' ') };
  });
  const typed: GarmentOption[] = [...custom.values()].map((name) => ({ id: CUSTOM_PREFIX + name, label: name, group: 'Other garments', mine: true, search: name }));
  const all = [...listed, ...typed];
  return [...all.filter((o) => o.mine), ...all.filter((o) => !o.mine)];
}

/**
 * The shop's services that can do this job: the ones that work on the garment (or its category when no garment
 * is picked yet). A typed-in garment or an empty pick shows every service.
 */
export function servicesForGarment(services: ServiceData[], garment: string, category: GarmentCategory | ''): ServiceData[] {
  const slug = canonicalGarment(garment);
  if (!slug && garment) {
    const typed = garment.trim().toLowerCase();
    const named = services.filter((s) => { const l = serviceGarments(s); return !l || l.some((g) => g.toLowerCase() === typed); });
    return named.length > 0 ? named : services;
  }
  if (!slug && (!category || category === 'other')) return services;
  const fits = (s: ServiceData) => {
    const list = serviceGarments(s);
    if (!list) return true;
    return slug ? list.includes(slug) : list.some((g) => categoryOfGarment(g) === category);
  };
  const matched = services.filter(fits);
  return matched.length > 0 ? matched : services;
}

/** The designs shown under a garment (or, before one is picked, a garment category) and service choice. */
export function designsFor(items: CatalogItem[], garment: string, serviceId: string, category: GarmentCategory | ''): CatalogItem[] {
  const slug = canonicalGarment(garment);
  return items.filter((item) => {
    const itemGarment = canonicalGarment(item.garment_type);
    if (slug) { if (itemGarment !== slug) return false; }
    else if (category && category !== 'other' && categoryOfGarment(itemGarment) !== category) return false;
    if (serviceId && item.service_id != null && String(item.service_id) !== serviceId) return false;
    return true;
  });
}

/** "Nov 15" or "Nov 15 – Nov 22" for a turnaround of `min`..`max` days from today; null when the shop has no estimate. */
export function readyBy(min?: number | null, max?: number | null): string | null {
  if (!min) return null;
  const fmt = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };
  return max && max > min ? `${fmt(min)} – ${fmt(max)}` : fmt(min);
}

export function designImage(item: CatalogItem): string | null {
  return item.images?.find((img) => img.is_primary)?.image_url || item.images?.[0]?.image_url || item.fabric_image_url || null;
}

/** What one piece of a design costs: its service's price plus any extra charge (lib/designPricing); null when it needs a quote. */
export function designUnitPrice(item: CatalogItem): number | null {
  if (item.pricing) return item.pricing.amount;
  const own = Number(item.price);
  return own > 0 ? own : null;
}

/** The old fixed list the job record, work ticket and reports still read; null when the new garment has no match there. */
const LEGACY_JOB_CATEGORY: Partial<Record<GarmentCategory, string>> = {
  barong: 'barong',
  traditional: 'filipiniana',
  dresses_gowns: 'gown',
  formal_wear: 'suit',
  uniforms: 'uniform',
};

export function legacyJobCategory(garment: string, service: ServiceData | undefined): string | null {
  if (serviceHasType(service, 'alteration_repair')) return 'alteration_repair';
  const category = categoryOfGarment(garment);
  return category ? LEGACY_JOB_CATEGORY[category] ?? null : null;
}

/** yyyy-mm-dd in the shop's own day, `days` from today (toISOString would be a day behind before 8am in PH). */
export function dateInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The size chart this order reads: the design's own when it has one, else its service's. */
export function chartFor(design: CatalogItem | null, service: ServiceData | undefined) {
  const source = design && ((design.size_chart_columns?.length ?? 0) > 0 || design.size_chart_image_url) ? design : service;
  return { columns: source?.size_chart_columns ?? [], rows: source?.size_chart_rows ?? [], image: source?.size_chart_image_url ?? null };
}
