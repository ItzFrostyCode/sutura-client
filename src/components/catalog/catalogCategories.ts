// Mirrors CatalogItem::GARMENT_CATEGORIES / GARMENT_CATEGORY_LABELS and
// CatalogItem::DEPARTMENTS / DEPARTMENT_LABELS on the backend exactly —
// these are validated server-side, so the owner's dropdown can only ever
// submit a value the search/filter/nav side already recognizes. Before
// this, "Garment Type" was a free-text input (placeholder: "e.g. Barong,
// Gown, Suit") and the header nav's category= filter did an exact,
// case-sensitive match against it — an owner typing "Barong" (capitalized,
// exactly as suggested) made their own item invisible from every nav link
// and category filter, with no error anywhere.
export const CATALOG_GARMENT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'barong', label: 'Barong Tagalog' },
  { value: 'gown', label: 'Gown' },
  { value: 'suit', label: 'Suit & Tuxedo' },
  { value: 'filipiniana', label: 'Filipiniana' },
  { value: 'uniform', label: 'School / Corporate Uniform' },
  { value: 'jersey', label: 'Jersey / Sublimation' },
  { value: 'lab_gown', label: 'Lab Gown' },
  { value: 'scrub_suit', label: 'Scrub Suit' },
  { value: 'corporate_wear', label: 'Corporate Wear' },
  { value: 'alteration_repair', label: 'Alteration / Repair' },
];

export const CATALOG_DEPARTMENTS: { value: string; label: string }[] = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'office', label: 'Office & Uniforms' },
];
