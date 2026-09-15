import { Shirt, Crown, UserRound, GraduationCap, Layers, Grid3x3, type LucideIcon } from 'lucide-react';

export interface GarmentCategory {
  value: string;
  label: string;
  Icon: LucideIcon;
}

// Generalized to what's actually populated in catalog_items.garment_type
// right now (checked live: uniform 17, gown 10, other 8, suit 8, barong 5) --
// the full 9-value GARMENT_CATEGORY_LABELS taxonomy used elsewhere (Reports)
// is the right list for internal reporting, but half of it (Filipiniana, Lab
// Gown, Scrub Suit, Corporate Wear, Alterations) has zero catalog items
// today, so showing it on customer-facing browse surfaces just meant half
// the list led to an empty state. Shared between the landing page and
// /search so the two don't drift.
export const GARMENT_CATEGORIES: GarmentCategory[] = [
  { value: '', label: 'All', Icon: Grid3x3 },
  { value: 'uniform', label: 'Uniforms', Icon: GraduationCap },
  { value: 'gown', label: 'Gowns', Icon: Crown },
  { value: 'suit', label: 'Suits', Icon: UserRound },
  { value: 'barong', label: 'Barong Tagalog', Icon: Shirt },
  { value: 'other', label: 'More Styles', Icon: Layers },
];
