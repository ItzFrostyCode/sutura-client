// Regenerates src/lib/garmentTaxonomy.ts from the server's App\Support\CanonicalTaxonomy.
// Run from sutura-client with the sutura-server repo next to it:  node scripts/gen-garment-taxonomy.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const php = 'require "vendor/autoload.php"; use App\\Support\\CanonicalTaxonomy as T; echo json_encode(["categories" => T::GARMENT_CATEGORIES, "garments" => T::GARMENTS, "legacy" => T::LEGACY_GARMENT_SLUGS, "groups" => T::SERVICE_GROUPS, "legacyServices" => T::LEGACY_SERVICE_CATEGORIES], JSON_UNESCAPED_UNICODE);';
const d = JSON.parse(execFileSync('php', ['-r', php], { cwd: '../sutura-server', encoding: 'utf8' }));
const outPath = 'src/lib/garmentTaxonomy.ts';
const j = (v) => JSON.stringify(v, null, 2).replace(/\[\n\s+([^\[\]{}]*?)\n\s*\]/g, (_m, inner) => "[" + inner.replace(/\n\s+/g, " ") + "]");

const out = `/**
 * GENERATED from sutura-server App\\Support\\CanonicalTaxonomy (2-level taxonomy, 2026-10-14) — do not edit by hand;
 * change the server file and run \`node scripts/gen-garment-taxonomy.mjs\`. Garment Category → Garment (no gender, no top/bottom levels), the 4
 * approved services with their capabilities, and the old-slug map (each old 4-level slug → the garment it was
 * merged into), so designs saved before the change still resolve.
 */

export const GARMENT_CATEGORIES = ${j(d.categories)} as const satisfies Record<string, { label: string; aliases: readonly string[] }>;

export type GarmentCategory = keyof typeof GARMENT_CATEGORIES;

export const GARMENT_CATEGORY_KEYS = Object.keys(GARMENT_CATEGORIES) as GarmentCategory[];

export interface Garment {
  label: string;
  category: GarmentCategory;
  aliases: readonly string[];
}

export const GARMENTS: Record<string, Garment> = ${j(d.garments)};

export const LEGACY_GARMENT_SLUGS: Record<string, string> = ${j(d.legacy)};

export interface ServiceCapability {
  label: string;
  aliases: readonly string[];
}

export interface ServiceGroup {
  label: string;
  description: string;
  aliases: readonly string[];
  capabilities: Record<string, ServiceCapability>;
}

export const SERVICE_GROUPS = ${j(d.groups)} as const satisfies Record<string, ServiceGroup>;

export type ServiceGroupKey = keyof typeof SERVICE_GROUPS;

export const SERVICE_GROUP_KEYS = Object.keys(SERVICE_GROUPS) as ServiceGroupKey[];

/** Old service categories → where their services went (null = no home). */
export const LEGACY_SERVICE_CATEGORIES: Record<string, ServiceGroupKey | null> = ${j(d.legacyServices)};

/** The garment a slug means today: old slugs resolve to what they were merged into; null for a custom name. */
export function canonicalGarment(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const s = slug.trim().toLowerCase();
  if (GARMENTS[s]) return s;
  return LEGACY_GARMENT_SLUGS[s] ?? null;
}

/** "Barong Tagalog" for barong_tagalog or an old slug merged into it; null for a custom name. */
export function garmentLabel(slug: string | null | undefined): string | null {
  const c = canonicalGarment(slug);
  return c ? GARMENTS[c].label : null;
}

export function categoryOfGarment(slug: string | null | undefined): GarmentCategory | null {
  const c = canonicalGarment(slug);
  return c ? GARMENTS[c].category : null;
}

export function garmentsInCategory(category: GarmentCategory): string[] {
  return Object.keys(GARMENTS).filter((s) => GARMENTS[s].category === category);
}

export function capabilityLabel(group: string | null | undefined, capability: string): string {
  const g = group && group in SERVICE_GROUPS ? (SERVICE_GROUPS[group as ServiceGroupKey] as ServiceGroup) : null;
  return g?.capabilities[capability]?.label ?? capability;
}

/** The service group a (possibly old) service category means today: "Alterations & Repairs"; null for none. */
export function serviceGroupLabel(category: string | null | undefined): string | null {
  if (!category) return null;
  const key = category in SERVICE_GROUPS ? (category as ServiceGroupKey) : LEGACY_SERVICE_CATEGORIES[category];
  return key ? SERVICE_GROUPS[key].label : null;
}

/** Garment Category → Garment for a design, e.g. ["Barong", "Barong Tagalog"]; a typed-in name shows under "Other Garments". */
export function catalogCategoryPath(item: { garment_type?: string | null }): string[] {
  if (!item.garment_type) return [];
  const slug = canonicalGarment(item.garment_type);
  if (!slug) return [GARMENT_CATEGORIES.other.label, item.garment_type];
  return [GARMENT_CATEGORIES[GARMENTS[slug].category].label, GARMENTS[slug].label];
}

/** "Services" → the service, e.g. ["Services", "Alterations & Repairs"]. */
export function serviceCategoryPath(service: { service_category?: string | null }): string[] {
  const label = serviceGroupLabel(service.service_category);
  return label ? ['Services', label] : [];
}
`;

writeFileSync(outPath, out);
console.log('wrote', outPath);
