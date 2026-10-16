import {
  GARMENTS,
  GARMENT_CATEGORIES,
  GARMENT_CATEGORY_KEYS,
  SERVICE_GROUPS,
  SERVICE_GROUP_KEYS,
  canonicalGarment,
  capabilityLabel,
  categoryOfGarment,
  type GarmentCategory,
  type ServiceGroup,
  type ServiceGroupKey,
} from '@/lib/garmentTaxonomy';
import type { Service } from './serviceHelpers';

/**
 * The shop's Services filters speak the same three levels as the customer's search and the landing page's categories:
 * Kind of work (the 4 services), Garment category, and Task. Same names, same order, same matching rules as the server
 * (ServiceController::publicIndex): a service works on a garment category when one of its garments is in it, and an
 * alteration / customization service with no garments ticked works on any garment.
 */
export interface CountedOption { value: string; label: string; count: number }

const ANY_GARMENT_GROUPS = ['alterations_repairs', 'garment_customization'];

const worksOnAnyGarment = (s: Service) =>
  ANY_GARMENT_GROUPS.includes(s.service_category ?? '') && !(s.garment_types ?? []).some((g) => canonicalGarment(g));

export const matchesGarmentCategory = (s: Service, category: GarmentCategory) =>
  worksOnAnyGarment(s) || (s.garment_types ?? []).some((g) => categoryOfGarment(g) === category);

const only = (options: CountedOption[]) => options.filter((o) => o.count > 0);

/** The 4 services in the order the landing page lists them, with how many of the shop's services are each. */
export function kindOptions(services: Service[]): CountedOption[] {
  return only(SERVICE_GROUP_KEYS.map((k) => ({
    value: k, label: SERVICE_GROUPS[k].label, count: services.filter((s) => s.service_category === k).length,
  })));
}

/** Garment categories (landing-page order) the shop's services work on. "Any garment" services are counted in each. */
export function garmentOptions(services: Service[]): CountedOption[] {
  return only(GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other').map((c) => ({
    value: c, label: GARMENT_CATEGORIES[c].label, count: services.filter((s) => matchesGarmentCategory(s, c)).length,
  })));
}

/** The tasks (capabilities) ticked on the shop's services — only those of the chosen kind of work when one is picked. */
export function taskOptions(services: Service[], kind: string): CountedOption[] {
  const counts = new Map<string, CountedOption>();
  services.filter((s) => !kind || s.service_category === kind).forEach((s) => {
    (s.capabilities ?? []).forEach((slug) => {
      const hit = counts.get(slug);
      if (hit) hit.count += 1;
      else counts.set(slug, { value: slug, label: capabilityLabel(s.service_category, slug), count: 1 });
    });
  });
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Everything a customer could type to find this service: its name, kind of work, garments, tasks and the words around them. */
export function searchText(s: Service): string {
  const group = s.service_category && s.service_category in SERVICE_GROUPS ? (SERVICE_GROUPS[s.service_category as ServiceGroupKey] as ServiceGroup) : null;
  const garments = (s.garment_types ?? []).flatMap((g) => { const c = canonicalGarment(g); return c ? [GARMENTS[c].label, ...GARMENTS[c].aliases] : [g]; });
  const tasks = (s.capabilities ?? []).flatMap((c) => [group?.capabilities[c]?.label ?? c, ...(group?.capabilities[c]?.aliases ?? [])]);
  return [s.name, group?.label, ...(group?.aliases ?? []), ...garments, ...tasks, ...(s.categories ?? []), ...(s.tags ?? [])].filter(Boolean).join(' ').toLowerCase();
}
