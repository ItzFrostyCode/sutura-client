import type { Service, ServicePackage } from '../serviceHelpers';

export type PackageSection = 'photo' | 'info' | 'services' | 'description';

export interface PackageDraft {
  name: string;
  description: string;
  bundlePrice: string;
  image_url: string;
  selectedIds: number[];
  service_category: string;
}

export const emptyPackageDraft = (): PackageDraft => ({ name: '', description: '', bundlePrice: '', image_url: '', selectedIds: [], service_category: '' });

export const toPackageDraft = (p: ServicePackage): PackageDraft => ({
  name: p.name,
  description: p.description ?? '',
  bundlePrice: p.bundle_price ? String(Number(p.bundle_price)) : '',
  image_url: p.image_url ?? '',
  selectedIds: p.services.map((s) => s.id),
  service_category: p.service_category ?? '',
});

export function buildPackagePayload(d: PackageDraft, isActive = true) {
  return {
    name: d.name.trim(),
    description: d.description.trim() || null,
    image_url: d.image_url || null,
    service_category: d.service_category || null,
    service_ids: d.selectedIds,
    bundle_price: d.bundlePrice.trim() === '' ? null : Number(d.bundlePrice),
    is_active: isActive,
  };
}

// Shared by the edit boxes and the create steps, so "required" means the same in both.
export function validatePackageSection(section: PackageSection, d: PackageDraft): string | null {
  if (section === 'info' && !d.name.trim()) return 'The package needs a name.';
  if (section === 'services' && d.selectedIds.length < 2) return 'Pick at least 2 services to bundle.';
  if (section === 'services' && !d.service_category) return 'Pick the category this package belongs to.';
  return null;
}

const SECTION_FIELDS: Record<PackageSection, (keyof PackageDraft)[]> = {
  photo: ['image_url'],
  info: ['name', 'bundlePrice'],
  services: ['selectedIds', 'service_category'],
  description: ['description'],
};

export const packageSectionChanged = (s: PackageSection, a: PackageDraft, b: PackageDraft) =>
  SECTION_FIELDS[s].some((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));

export const pricedTotal = (services: Service[]) => services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0);

/** The category most of the chosen services share — the package's default category. */
export function suggestPackageCategory(services: Service[], ids: number[]): string {
  const counts = new Map<string, number>();
  services.filter((s) => ids.includes(s.id) && s.service_category).forEach((s) => counts.set(s.service_category!, (counts.get(s.service_category!) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}
