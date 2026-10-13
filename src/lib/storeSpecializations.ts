import {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
} from '@/lib/canonicalTaxonomy';

// What a store can say it specializes in: the Men/Women/Kids departments
// plus the "services offered" a shop lists — modelled on Davao shops' own
// signboards. Mirrors CanonicalTaxonomy::storeSpecializations() /
// STORE_SERVICE_TAGS on the backend. A store tag only — separate from the
// Services categories that classify individual services and packages.
const STORE_SERVICE_TAGS: { value: string; label: string }[] = [
  { value: 'custom_tailoring', label: 'Custom Tailoring' },
  { value: 'alterations_repairs', label: 'Alterations & Repairs' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'office', label: 'Office' },
  { value: 'school', label: 'School' },
  { value: 'maritime', label: 'Maritime' },
  { value: 'medical', label: 'Medical' },
  { value: 'sports', label: 'Sports' },
  { value: 'embroidery', label: 'Embroidery' },
];

export const STORE_SPECIALIZATIONS: { value: string; label: string; group: 'Apparel' | 'Services' }[] = [
  ...DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d], group: 'Apparel' as const })),
  ...STORE_SERVICE_TAGS.map((s) => ({ ...s, group: 'Services' as const })),
];

// No longer offered, but still saved on shops that picked them before —
// labelled so they don't show as raw slugs. Server: LEGACY_STORE_SERVICE_TAGS.
const LEGACY_LABELS: Record<string, string> = {
  uniform_production: 'Uniform Production',
  printing_sublimation: 'Printing & Sublimation',
  custom_costume_creation: 'Custom Costume Creation',
  others: 'Others',
};

export function specializationLabel(value: string): string {
  return STORE_SPECIALIZATIONS.find((s) => s.value === value)?.label ?? LEGACY_LABELS[value] ?? value.replace(/_/g, ' ');
}
