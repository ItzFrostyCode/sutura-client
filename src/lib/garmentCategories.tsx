import { Shirt, Crown, UserRound, GraduationCap, Sparkles, Drama, Layers, Grid3x3, Watch, type LucideIcon } from 'lucide-react';

export interface GarmentCategory {
  value: string;
  label: string;
  Icon: LucideIcon;
  // catalog_items.garment_type is now a real, validated enum
  // (CatalogItem::GARMENT_CATEGORIES on the backend) that includes
  // 'jersey' — it didn't used to (garment_type was free text with no
  // canonical value list, so real jersey items had nowhere correct to go
  // and got tagged garment_type=uniform instead, the exact bug this file
  // used to work around with a name-search fallback). 'costume' and
  // 'accessories' are genuinely cross-cutting search terms (a costume or
  // an accessory isn't itself a base garment type), not workarounds —
  // those stay q=.
  filterBy: 'garment_type' | 'q';
}

export const GARMENT_CATEGORIES: GarmentCategory[] = [
  { value: '', label: 'All', Icon: Grid3x3, filterBy: 'garment_type' },
  { value: 'jersey', label: 'Jersey', Icon: Shirt, filterBy: 'garment_type' },
  { value: 'uniform', label: 'Uniform', Icon: GraduationCap, filterBy: 'garment_type' },
  { value: 'barong', label: 'Barong Tagalog', Icon: Shirt, filterBy: 'garment_type' },
  { value: 'filipiniana', label: 'Filipiniana', Icon: Sparkles, filterBy: 'garment_type' },
  { value: 'suit', label: 'Suit', Icon: UserRound, filterBy: 'garment_type' },
  { value: 'gown', label: 'Gown', Icon: Crown, filterBy: 'garment_type' },
  { value: 'costume', label: 'Costumes', Icon: Drama, filterBy: 'q' },
  // Same shape as jersey/costume above — no catalog_items.garment_type
  // value for this either (ties/cufflinks/scarves get tagged under
  // whatever base garment they came with), matches the header mega-menu's
  // own Accessories chip set, which has always been a name/description
  // search (q=), never a garment_type filter.
  { value: 'accessories', label: 'Accessories', Icon: Watch, filterBy: 'q' },
  { value: 'other', label: 'More Styles', Icon: Layers, filterBy: 'garment_type' },
];

// Shared helper so every consumer applies the garment_type-vs-q split the
// same way instead of re-deriving it.
export function applyCategoryFilter(params: Record<string, string | number>, categoryValue: string): void {
  if (!categoryValue) return;
  const category = GARMENT_CATEGORIES.find((c) => c.value === categoryValue);
  if (!category) {
    const fallbackQ = categoryValue.replace(/_/g, ' ');
    params.q = params.q ? `${params.q} ${fallbackQ}` : fallbackQ;
    return;
  }
  if (category.filterBy === 'q') {
    params.q = params.q ? `${params.q} ${category.value}` : category.value;
  } else {
    params.garment_type = category.value;
  }
}
