export interface CategoryVisualConfig {
  imageUrl: string;
  subtitle: string;
}

// Photos for the home page's category cards — one per garment category (2-level taxonomy, 2026-10-14, no Men /
// Women / Kids) and one per approved service, reusing the curated photos in public/images/categories.
export const GARMENT_CATEGORY_VISUALS: Record<string, CategoryVisualConfig> = {
  barong: { imageUrl: '/images/categories/men_barong.jpg', subtitle: 'Handcrafted Piña & Jusi' },
  traditional: { imageUrl: '/images/categories/filipiniana.jpg', subtitle: 'Filipiniana & Terno' },
  uniforms: { imageUrl: '/images/categories/school_uniform.jpg', subtitle: 'School, Office & Medical' },
  jerseys_sportswear: { imageUrl: '/images/categories/jersey.jpg', subtitle: 'Team Jerseys, Cut & Sewn' },
  dresses_gowns: { imageUrl: '/images/categories/wedding_gown.jpg', subtitle: 'Bridal, Debut & Evening' },
  formal_wear: { imageUrl: '/images/categories/men_suit.jpg', subtitle: 'Suits, Tuxedos & Blazers' },
  shirts_tops: { imageUrl: '/images/categories/shirt.jpg', subtitle: 'Polos, Shirts & Blouses' },
  pants_bottoms: { imageUrl: '/images/categories/pants.jpg', subtitle: 'Slacks, Jeans & Skirts' },
  outerwear: { imageUrl: '/images/categories/outerwear.jpg', subtitle: 'Jackets & Coats' },
  costumes: { imageUrl: '/images/categories/dress.jpg', subtitle: 'Stage, Dance & Cosplay' },
};

const DEFAULT_CATEGORY_IMAGE: CategoryVisualConfig = {
  imageUrl: '/images/categories/men_suit.jpg',
  subtitle: 'Bespoke Tailoring',
};

export function getGarmentCategoryVisual(category: string): CategoryVisualConfig {
  return GARMENT_CATEGORY_VISUALS[category] ?? DEFAULT_CATEGORY_IMAGE;
}

export const SERVICE_CATEGORY_VISUALS: Record<string, CategoryVisualConfig> = {
  custom_tailoring: { imageUrl: '/images/categories/men_suit.jpg', subtitle: 'Bespoke & Made-to-Measure' },
  uniform_production: { imageUrl: '/images/categories/uniform.jpg', subtitle: 'Uniforms, Jerseys & Teamwear' },
  alterations_repairs: { imageUrl: '/images/categories/women_pants.jpg', subtitle: 'Fit Adjustments & Repairs' },
  garment_customization: { imageUrl: '/images/categories/blazer.jpg', subtitle: 'Logos, Names & Badges' },
};

export function getServiceCategoryVisual(serviceCategory: string): CategoryVisualConfig {
  return SERVICE_CATEGORY_VISUALS[serviceCategory] ?? DEFAULT_CATEGORY_IMAGE;
}
