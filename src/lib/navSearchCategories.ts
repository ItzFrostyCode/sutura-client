export interface SearchDepartment {
  key: string;
  label: string;
  categories: {
    value: string;
    label: string;
    query?: string;
  }[];
}

export const SEARCH_DEPARTMENTS: SearchDepartment[] = [
  {
    key: 'all',
    label: 'All',
    categories: [
      { value: 'suit', label: 'Suits' },
      { value: 'barong', label: 'Barong Tagalog' },
      { value: 'gown', label: 'Gowns' },
      { value: 'filipiniana', label: 'Filipiniana' },
      { value: 'uniform', label: 'Uniforms' },
      { value: 'jersey', label: 'Jerseys' },
      { value: 'shirt', label: 'Shirts', query: 'Shirt' },
    ],
  },
  {
    key: 'men',
    label: 'Men',
    categories: [
      { value: 'suit', label: 'Suits' },
      { value: 'tuxedo', label: 'Tuxedos', query: 'Tuxedo' },
      { value: 'barong', label: 'Barong Tagalog' },
      { value: 'shirt', label: 'Shirts', query: 'Shirt' },
      { value: 'blazer', label: 'Blazers', query: 'Blazer' },
      { value: 'pants', label: 'Pants & Trousers', query: 'Pants' },
      { value: 'outerwear', label: 'Outerwear & Jackets', query: 'Jacket' },
      { value: 'accessories', label: 'Accessories', query: 'accessories' },
    ],
  },
  {
    key: 'women',
    label: 'Women',
    categories: [
      { value: 'gown', label: 'Wedding Gowns' },
      { value: 'filipiniana', label: 'Modern Filipiniana' },
      { value: 'suit', label: 'Suits & Blazers' },
      { value: 'dress', label: 'Dresses', query: 'Dress' },
      { value: 'pants', label: 'Pants & Skirts', query: 'Skirt' },
      { value: 'accessories', label: 'Accessories', query: 'accessories' },
    ],
  },
  {
    key: 'wedding',
    label: 'Wedding',
    categories: [
      { value: 'gown', label: 'Bridal Gowns' },
      { value: 'barong', label: 'Wedding Barong' },
      { value: 'suit', label: 'Wedding Suits' },
      { value: 'tuxedo', label: 'Bespoke Tuxedos', query: 'Tuxedo' },
      { value: 'filipiniana', label: 'Modern Terno & Filipiniana' },
      { value: 'accessories', label: 'Bridal Accessories', query: 'accessories' },
    ],
  },
  {
    key: 'office',
    label: 'Office & Teams',
    categories: [
      { value: 'uniform', label: 'Corporate Uniforms' },
      { value: 'school_uniform', label: 'School Uniforms', query: 'School Uniform' },
      { value: 'scrub_suit', label: 'Medical Scrubs', query: 'Scrubs' },
      { value: 'jersey', label: 'Team Jerseys' },
    ],
  },
];

export interface CollectionChip {
  label: string;
  q: string;
}

export const CATEGORY_COLLECTIONS: Record<string, CollectionChip[]> = {
  suit: [
    { label: 'All Suits', q: 'Suits' },
    { label: 'Premium', q: 'Premium Suits' },
    { label: 'Luxury', q: 'Luxury Suits' },
    { label: 'Tuxedo', q: 'Tuxedo' },
    { label: 'Double Breasted', q: 'Double Breasted' },
    { label: 'Single Breasted', q: 'Single Breasted' },
    { label: 'Slim Fit', q: 'Slim Fit Suit' },
  ],
  barong: [
    { label: 'All Barong', q: 'Barong Tagalog' },
    { label: 'Piña Silk', q: 'Piña Barong' },
    { label: 'Cocoon Silk', q: 'Cocoon Barong' },
    { label: 'Jusilyn', q: 'Jusilyn Barong' },
    { label: 'Organza', q: 'Organza Barong' },
    { label: 'Monochromatic', q: 'Monochromatic Barong' },
  ],
  gown: [
    { label: 'All Gowns', q: 'Wedding Gowns' },
    { label: 'A-Line', q: 'A-Line Gown' },
    { label: 'Ball Gown', q: 'Ball Gown' },
    { label: 'Mermaid', q: 'Mermaid Gown' },
    { label: 'Minimalist', q: 'Minimalist Gown' },
    { label: 'Reception Dress', q: 'Reception Dress' },
  ],
  filipiniana: [
    { label: 'All Filipiniana', q: 'Filipiniana' },
    { label: 'Modern Terno', q: 'Modern Terno' },
    { label: 'Maria Clara', q: 'Maria Clara' },
    { label: 'Terno Bolero', q: 'Bolero' },
    { label: 'Mestiza Dress', q: 'Mestiza Dress' },
  ],
  uniform: [
    { label: 'All Uniforms', q: 'Uniform' },
    { label: 'Corporate', q: 'Corporate Uniform' },
    { label: 'School', q: 'School Uniform' },
    { label: 'Medical Scrubs', q: 'Scrubs' },
    { label: 'Security', q: 'Security Uniform' },
  ],
  jersey: [
    { label: 'All Jerseys', q: 'Jersey' },
    { label: 'Basketball', q: 'Basketball Jersey' },
    { label: 'Volleyball', q: 'Volleyball Jersey' },
    { label: 'Sublimation', q: 'Sublimation' },
    { label: 'Esports', q: 'Esports Jersey' },
  ],
  shirt: [
    { label: 'All Shirts', q: 'Shirt' },
    { label: 'Dress Shirt', q: 'Dress Shirt' },
    { label: 'Casual Shirt', q: 'Casual Shirt' },
    { label: 'Oxford', q: 'Oxford Shirt' },
  ],
};

export function getCategoryCollections(cat?: string | null): CollectionChip[] {
  if (!cat) return [];
  const key = cat.toLowerCase();
  for (const [prefix, list] of Object.entries(CATEGORY_COLLECTIONS)) {
    if (key.includes(prefix)) return list;
  }
  return [];
}
