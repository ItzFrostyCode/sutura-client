// What a store can say it specializes in: the "services offered" a shop lists — modelled on Davao shops' own
// signboards. Mirrors CanonicalTaxonomy::storeSpecializations() / STORE_SERVICE_TAGS on the backend. A store tag
// only — separate from the Services that classify individual services and packages. Men / Women / Kids were
// dropped on 2026-10-14 (who wears it is not a category); shops that saved them keep them, hidden.
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

export const STORE_SPECIALIZATIONS: { value: string; label: string; group: 'Services' }[] =
  STORE_SERVICE_TAGS.map((s) => ({ ...s, group: 'Services' as const }));

/** Old Men / Women / Kids tags — still saved on some shops, never shown. */
const HIDDEN_SPECIALIZATIONS = ['men', 'women', 'children'];

/** A shop's saved tags without the hidden gender ones. */
export function visibleSpecializations(values: readonly string[] | null | undefined): string[] {
  return (values ?? []).filter((v) => !HIDDEN_SPECIALIZATIONS.includes(v));
}

// No longer offered, but still saved on shops that picked them before —
// labelled so they don't show as raw slugs. Server: LEGACY_STORE_SERVICE_TAGS.
const LEGACY_LABELS: Record<string, string> = {
  uniform_production: 'Uniform Production',
  printing_sublimation: 'Printing & Sublimation',
  custom_costume_creation: 'Custom Costume Creation',
  others: 'Others',
  men: "Men's Apparel",
  women: "Women's Apparel",
  children: "Children's Apparel",
};

export function specializationLabel(value: string): string {
  return STORE_SPECIALIZATIONS.find((s) => s.value === value)?.label ?? LEGACY_LABELS[value] ?? value.replace(/_/g, ' ');
}
