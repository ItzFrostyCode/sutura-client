import { Shirt, Crown, UserRound, GraduationCap, Sparkles, Drama, Layers, Grid3x3, Watch, type LucideIcon } from 'lucide-react';

export interface GarmentCategory {
  value: string;
  label: string;
  Icon: LucideIcon;
  // catalog_items.garment_type has no 'jersey' or 'costume' value -- those
  // are real, common item names (checked live: 13 items with "jersey" in
  // the name, all tagged garment_type=uniform) but not a distinct type
  // column value, so those two categories filter by a name search (q=)
  // instead of the garment_type column the rest use.
  filterBy: 'garment_type' | 'q';
}

// Checked live against catalog_items: Filipiniana and Costumes currently
// have 0 matching items (0 by garment_type for Filipiniana, 0 by name match
// for "costume") -- kept in the list anyway per an explicit decision to
// show the full category set rather than only what's stocked today, unlike
// the earlier data-only-driven cut. Clicking either shows the real empty
// state, not a fabricated result.
export const GARMENT_CATEGORIES: GarmentCategory[] = [
  { value: '', label: 'All', Icon: Grid3x3, filterBy: 'garment_type' },
  { value: 'jersey', label: 'Jersey', Icon: Shirt, filterBy: 'q' },
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
