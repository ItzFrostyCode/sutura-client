import {
  GARMENT_CATEGORIES,
  GARMENTS,
  SERVICE_GROUPS,
  SERVICE_GROUP_KEYS,
  type GarmentCategory,
  type ServiceGroupKey,
} from '@/lib/garmentTaxonomy';

// All Categories data, 2-level (2026-10-14): Garment Category → Garment, and the 4 services with their tasks.
// No Men / Women / Kids and no top/bottom levels, so every garment appears once.

export interface DirectoryEntry {
  letter: string;
  label: string;
  breadcrumb: string;
  href: string;
}

/** Searching a garment shows the shops that make it, the ones that alter or fix it, and its designs. */
export const garmentHref = (slug: string) => `/search?q=${encodeURIComponent(GARMENTS[slug].label.split(' / ')[0])}`;

/** A category searches by its own name (its first alias, e.g. "barong", "uniform", "pants"). */
export const categoryHref = (cat: GarmentCategory) =>
  `/search?q=${encodeURIComponent(GARMENT_CATEGORIES[cat].aliases[0] ?? GARMENT_CATEGORIES[cat].label)}`;

/** The Services tab, limited to one service — and to the services that ticked one task. */
export const serviceHref = (group: ServiceGroupKey, capability?: string) =>
  `/search?tab=services&service_category=${group}${capability ? `&service_type=${capability}` : ''}`;

/** The A–Z directory: the 54 garments, each once, with "Category > Garment". */
export function buildDirectoryEntries(): DirectoryEntry[] {
  return Object.entries(GARMENTS)
    .map(([slug, g]) => ({
      letter: g.label.charAt(0).toUpperCase(),
      label: g.label,
      breadcrumb: `${GARMENT_CATEGORIES[g.category].label} > ${g.label}`,
      href: garmentHref(slug),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function serviceEntries(): { group: ServiceGroupKey; label: string; description: string; capabilities: { slug: string; label: string }[] }[] {
  return SERVICE_GROUP_KEYS.map((group) => ({
    group,
    label: SERVICE_GROUPS[group].label,
    description: SERVICE_GROUPS[group].description,
    capabilities: Object.entries(SERVICE_GROUPS[group].capabilities).map(([slug, c]) => ({ slug, label: c.label })),
  }));
}

export function groupByLetter(entries: DirectoryEntry[]): Map<string, DirectoryEntry[]> {
  const map = new Map<string, DirectoryEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.letter) ?? [];
    list.push(entry);
    map.set(entry.letter, list);
  }
  return map;
}

export const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
