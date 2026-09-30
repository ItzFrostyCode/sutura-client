import {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
} from '@/lib/canonicalTaxonomy';

// What a store can say it specializes in — the same top-level axes the
// header nav uses (Men/Women/Kids + each Services category). Mirrors
// CanonicalTaxonomy::storeSpecializations() on the backend, which
// UpdateStoreRequest validates against. Replaces the old free-floating
// barong/gown/suit/... list, which didn't map onto any part of the taxonomy.
export const STORE_SPECIALIZATIONS: { value: string; label: string; group: 'Apparel' | 'Services' }[] = [
  ...DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d], group: 'Apparel' as const })),
  ...SERVICE_CATEGORIES.filter((c) => c !== 'others').map((c) => ({
    value: c,
    label: SERVICE_CATEGORY_LABELS[c],
    group: 'Services' as const,
  })),
];

export function specializationLabel(value: string): string {
  return STORE_SPECIALIZATIONS.find((s) => s.value === value)?.label ?? value.replace(/_/g, ' ');
}
