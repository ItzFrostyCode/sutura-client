export interface CategoryVisualConfig {
  imageUrl: string;
  subtitle: string;
}

export const CATEGORY_VISUALS: Record<string, Record<string, CategoryVisualConfig>> = {
  men: {
    suit: { imageUrl: '/images/categories/men_suit.jpg', subtitle: 'Bespoke 3-Piece' },
    tuxedo: { imageUrl: '/images/categories/men_tuxedo.jpg', subtitle: 'Black Tie Gala' },
    barong: { imageUrl: '/images/categories/men_barong.jpg', subtitle: 'Handcrafted Piña' },
    shirt: { imageUrl: '/images/categories/shirt.jpg', subtitle: 'Crisp Tailored' },
    blazer: { imageUrl: '/images/categories/blazer.jpg', subtitle: 'Structured Wool' },
    pants: { imageUrl: '/images/categories/pants.jpg', subtitle: 'Pleated Trousers' },
    outerwear: { imageUrl: '/images/categories/men_outerwear.jpg', subtitle: 'Luxury Trench & Coats' },
  },
  women: {
    gown: { imageUrl: '/images/categories/wedding_gown.jpg', subtitle: 'Haute Couture' },
    filipiniana: { imageUrl: '/images/categories/filipiniana.jpg', subtitle: 'Modern Butterfly Terno' },
    suit: { imageUrl: '/images/categories/women_suit.jpg', subtitle: 'Tailored Power Suits' },
    dress: { imageUrl: '/images/categories/dress.jpg', subtitle: 'Pleated Cocktail Dresses' },
    pants: { imageUrl: '/images/categories/women_pants.jpg', subtitle: 'Tailored Wide-Leg' },
  },
  wedding: {
    gown: { imageUrl: '/images/categories/wedding_gown.jpg', subtitle: 'Bridal Couture' },
    barong: { imageUrl: '/images/categories/men_barong.jpg', subtitle: 'Piña Silk Wedding' },
    suit: { imageUrl: '/images/categories/wedding_suit.jpg', subtitle: 'Groom & Entourage' },
    tuxedo: { imageUrl: '/images/categories/men_tuxedo.jpg', subtitle: 'Black Tie Ceremony' },
    filipiniana: { imageUrl: '/images/categories/filipiniana.jpg', subtitle: 'Modern Terno Bridal' },
  },
  office: {
    uniform: { imageUrl: '/images/categories/uniform.jpg', subtitle: 'Corporate Executive' },
    school_uniform: { imageUrl: '/images/categories/school_uniform.jpg', subtitle: 'Academic Attire' },
    scrub_suit: { imageUrl: '/images/categories/scrubs.jpg', subtitle: 'Medical & Healthcare' },
    jersey: { imageUrl: '/images/categories/jersey.jpg', subtitle: 'Custom Sublimation' },
  },
};

const DEFAULT_CATEGORY_IMAGE: CategoryVisualConfig = {
  imageUrl: '/images/categories/men_suit.jpg',
  subtitle: 'Bespoke Tailoring',
};

export function getCategoryVisual(deptKey: string, categoryValue: string): CategoryVisualConfig {
  return (
    CATEGORY_VISUALS[deptKey]?.[categoryValue] ??
    CATEGORY_VISUALS.men[categoryValue] ??
    CATEGORY_VISUALS.women[categoryValue] ??
    CATEGORY_VISUALS.office[categoryValue] ??
    DEFAULT_CATEGORY_IMAGE
  );
}
