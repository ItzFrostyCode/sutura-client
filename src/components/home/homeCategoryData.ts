export interface CategoryVisualConfig {
  imageUrl: string;
  subtitle: string;
}

// Keyed by canonical Department -> subcategory slug (canonicalTaxonomy.ts),
// not the old flat men/women/wedding/office department + garment_type
// vocabulary. Only subcategories with a curated photo are listed here —
// anything else (including the whole 'children' department, which has no
// leaf garment types defined in Categories.md yet, same gap noted in
// canonicalTaxonomy.ts's TAXONOMY_TREE) falls back to DEFAULT_CATEGORY_IMAGE
// below rather than a real, but honestly non-existent, product photo.
export const CATEGORY_VISUALS: Record<string, Record<string, CategoryVisualConfig>> = {
  men: {
    formal_wear: { imageUrl: '/images/categories/men_suit.jpg', subtitle: 'Bespoke 3-Piece' },
    traditional_wear: { imageUrl: '/images/categories/men_barong.jpg', subtitle: 'Handcrafted Piña' },
    casual_wear: { imageUrl: '/images/categories/shirt.jpg', subtitle: 'Crisp Tailored' },
    uniforms_workwear: { imageUrl: '/images/categories/uniform.jpg', subtitle: 'Corporate & School' },
    sportswear_teamwear: { imageUrl: '/images/categories/jersey.jpg', subtitle: 'Custom Sublimation' },
    outerwear: { imageUrl: '/images/categories/men_outerwear.jpg', subtitle: 'Luxury Trench & Coats' },
  },
  women: {
    formal_wear: { imageUrl: '/images/categories/women_suit.jpg', subtitle: 'Tailored Power Suits' },
    traditional_cultural_wear: { imageUrl: '/images/categories/filipiniana.jpg', subtitle: 'Modern Butterfly Terno' },
    dresses_gowns: { imageUrl: '/images/categories/wedding_gown.jpg', subtitle: 'Haute Couture' },
    casual_wear: { imageUrl: '/images/categories/women_pants.jpg', subtitle: 'Everyday Tailored' },
    uniforms_workwear: { imageUrl: '/images/categories/school_uniform.jpg', subtitle: 'Academic Attire' },
    sportswear_teamwear: { imageUrl: '/images/categories/jersey.jpg', subtitle: 'Custom Sublimation' },
  },
};

const DEFAULT_CATEGORY_IMAGE: CategoryVisualConfig = {
  imageUrl: '/images/categories/men_suit.jpg',
  subtitle: 'Bespoke Tailoring',
};

export function getCategoryVisual(deptKey: string, subcategoryValue: string): CategoryVisualConfig {
  return CATEGORY_VISUALS[deptKey]?.[subcategoryValue] ?? DEFAULT_CATEGORY_IMAGE;
}

// Same convention as CATEGORY_VISUALS above, keyed by the Services taxonomy
// (canonicalTaxonomy.ts's SERVICE_CATEGORIES) instead of department/
// subcategory — reuses existing curated photos where the look genuinely
// fits rather than commissioning new ones.
export const SERVICE_CATEGORY_VISUALS: Record<string, CategoryVisualConfig> = {
  custom_tailoring: { imageUrl: '/images/categories/men_suit.jpg', subtitle: 'Bespoke & Made-to-Measure' },
  alterations_repairs: { imageUrl: '/images/categories/shirt.jpg', subtitle: 'Fit Adjustments & Repairs' },
  uniform_production: { imageUrl: '/images/categories/uniform.jpg', subtitle: 'School & Corporate' },
  printing_sublimation: { imageUrl: '/images/categories/jersey.jpg', subtitle: 'Custom Sublimation' },
  custom_costume_creation: { imageUrl: '/images/categories/filipiniana.jpg', subtitle: 'Cultural & Stage Wear' },
};

export function getServiceCategoryVisual(serviceCategory: string): CategoryVisualConfig {
  return SERVICE_CATEGORY_VISUALS[serviceCategory] ?? DEFAULT_CATEGORY_IMAGE;
}
