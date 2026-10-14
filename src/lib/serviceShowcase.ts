// How a shop groups its own services on its storefront's Services tab — the
// "Service Categories" chips (Uniform, Casual, Office…). Set per service by
// the owner; mirrors CanonicalTaxonomy::SERVICE_SHOWCASE_CATEGORIES. Order is
// the chip order. Separate from SERVICE_CATEGORIES (search/job-order taxonomy).
export const SHOWCASE_CATEGORIES: { value: string; label: string; blurb: string }[] = [
  { value: 'uniform', label: 'Uniform', blurb: 'Custom-tailored uniforms for schools, offices and organizations.' },
  { value: 'casual', label: 'Casual', blurb: 'Everyday shirts, polos and day wear, made to your size.' },
  { value: 'office', label: 'Office', blurb: 'Corporate shirts, blazers and office uniforms.' },
  { value: 'formal', label: 'Formal', blurb: 'Suits, barong, gowns and wear for special occasions.' },
  { value: 'sports', label: 'Sports', blurb: 'Jerseys, team kits and sublimated sportswear.' },
  { value: 'school', label: 'School', blurb: 'School uniform sets for students.' },
  { value: 'medical', label: 'Medical', blurb: 'Scrubs, lab coats and medical uniforms.' },
  { value: 'maritime', label: 'Maritime', blurb: 'Seafarer and maritime uniforms.' },
  { value: 'embroidery', label: 'Embroidery', blurb: 'Embroidered names, logos and details.' },
  { value: 'custom_tailoring', label: 'Custom Tailoring', blurb: 'Made-to-measure pieces cut for you.' },
  { value: 'alterations_repairs', label: 'Alterations & Repairs', blurb: 'Resizing, hemming and repairs on clothes you already own.' },
];

export const showcaseCategory = (value?: string | null) =>
  SHOWCASE_CATEGORIES.find((c) => c.value === value) ?? null;
