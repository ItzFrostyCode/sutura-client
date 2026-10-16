import {
  GARMENT_CATEGORIES,
  GARMENT_CATEGORY_KEYS,
  SERVICE_GROUPS,
  SERVICE_GROUP_KEYS,
  categoryOfGarment,
  type GarmentCategory,
  type ServiceGroupKey,
} from '@/lib/garmentTaxonomy';

/**
 * How a shop's storefront groups its services: by the SAME garment categories the customer's landing page and search use
 * ("Barong", "Uniforms", "Jerseys & Sportswear"…). A service sits under every category of the garments it works on; one
 * that works on any garment (alterations, embroidery) sits under its kind of work instead. The owner types nothing for
 * this — it follows from what they ticked when they set the service up.
 */
export interface StorefrontGroup { value: string; label: string; blurb: string }

interface Groupable { garment_types?: string[] | null; service_category?: string | null }

const categoryGroup = (c: GarmentCategory): StorefrontGroup => ({
  value: c, label: GARMENT_CATEGORIES[c].label, blurb: `Made, altered or customized for ${GARMENT_CATEGORIES[c].label.toLowerCase()}.`,
});

const kindGroup = (k: string): StorefrontGroup =>
  k in SERVICE_GROUPS
    ? { value: `kind:${k}`, label: SERVICE_GROUPS[k as ServiceGroupKey].label, blurb: SERVICE_GROUPS[k as ServiceGroupKey].description }
    : { value: 'kind:other', label: 'Other services', blurb: 'More of what this shop does.' };

export function groupsOf(s: Groupable): StorefrontGroup[] {
  const categories = new Set((s.garment_types ?? []).map(categoryOfGarment).filter((c): c is GarmentCategory => Boolean(c)));
  if (categories.size > 0) return GARMENT_CATEGORY_KEYS.filter((c) => categories.has(c)).map(categoryGroup);
  return [kindGroup(s.service_category ?? '')];
}

/** The chips for a list of services: garment categories first (landing-page order), then kinds of work. */
export function groupsOfServices(services: Groupable[]): StorefrontGroup[] {
  const seen = new Map<string, StorefrontGroup>();
  services.forEach((s) => groupsOf(s).forEach((g) => seen.set(g.value, g)));
  const order = [...GARMENT_CATEGORY_KEYS, ...SERVICE_GROUP_KEYS.map((k) => `kind:${k}`), 'kind:other'];
  return [...seen.values()].sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
}

export const inGroup = (s: Groupable, value: string) => groupsOf(s).some((g) => g.value === value);
