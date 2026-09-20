// Shared between PublicNav's hamburger drill-down (Suits > shows this as
// a vertical "< Suits" list) and /search's category landing page (title +
// horizontal chip carousel) — same data, two presentations, so they can't
// drift apart. A chip with no `q` is a tier concept SUTURA has no column
// for (Clearance/Wedding/Premium/Luxury/New) — rendered greyed-out and
// non-clickable everywhere it appears; falls back to the set's own base
// search when tapped rather than doing nothing. Chips with `q` are real
// text searches against catalog_items.name.
export interface CategoryChip { label: string; q?: string }
export const CATEGORY_CHIP_SETS: Record<string, { title: string; chips: CategoryChip[] }> = {
  suit: { title: 'Suits', chips: [
    { label: 'All Suits', q: 'suit' },
    { label: 'Clearance Suits' },
    { label: 'Wedding Suits' },
    { label: 'Premium Suits' },
    { label: 'Luxury Suits' },
    { label: 'Tuxedo Suits', q: 'tuxedo suit' },
    { label: 'Blue Suits', q: 'blue suit' },
    { label: 'Gray Suits', q: 'gray suit' },
    { label: 'Black Suits', q: 'black suit' },
  ] },
  tuxedo: { title: 'Tuxedos', chips: [
    { label: 'All Tuxedos', q: 'tuxedo' },
    { label: 'Clearance Tuxedos' },
    { label: 'Wedding Tuxedos' },
    { label: 'Premium Tuxedos' },
    { label: 'Black Tuxedos', q: 'black tuxedo' },
  ] },
  shirt: { title: 'Shirts', chips: [
    { label: 'All Shirts', q: 'shirt' },
    { label: 'Clearance Shirts' },
    { label: 'Dress Shirts', q: 'dress shirt' },
    { label: 'Premium Shirts' },
    { label: 'White Shirts', q: 'white shirt' },
    { label: 'Blue Shirts', q: 'blue shirt' },
  ] },
  blazer: { title: 'Blazers', chips: [
    { label: 'All Blazers', q: 'blazer' },
    { label: 'Clearance Blazers' },
    { label: 'Premium Blazers' },
    { label: 'Dinner Jackets', q: 'dinner jacket' },
    { label: 'New Blazers' },
  ] },
  pant: { title: 'Pants', chips: [
    { label: 'All Pants', q: 'pant' },
    { label: 'Clearance Pants' },
    { label: 'Wedding Pants' },
    { label: 'Premium Pants' },
    { label: 'Luxury Pants' },
    { label: 'Black Pants', q: 'black pant' },
    { label: 'Gray Pants', q: 'gray pant' },
  ] },
  jacket: { title: 'Outerwear', chips: [
    { label: 'All Outerwear', q: 'jacket' },
    { label: 'Clearance Outerwear' },
    { label: 'Raincoats', q: 'raincoat' },
    { label: 'Mac Coats', q: 'coat' },
    { label: 'Trench Coats', q: 'trench' },
    { label: 'Overcoats', q: 'overcoat' },
    { label: 'Bomber Jackets', q: 'bomber' },
  ] },
  accessories: { title: 'Accessories', chips: [
    { label: 'All Accessories', q: 'accessories' },
    { label: 'Ties', q: 'tie' },
    { label: 'Pocket Squares', q: 'pocket' },
    { label: 'Cufflinks', q: 'cufflink' },
    { label: 'Tie Clips', q: 'tie clip' },
    { label: 'Scarves', q: 'scarf' },
  ] },
  jersey: { title: 'Jerseys & Team Apparel', chips: [
    { label: 'All Jerseys', q: 'jersey' },
    { label: 'Basketball Jerseys', q: 'basketball' },
    { label: 'Volleyball Jerseys', q: 'volleyball' },
    { label: 'Cycling Jerseys', q: 'cycling' },
    { label: 'Esports Jerseys', q: 'esports' },
    { label: 'Custom Team Sublimation', q: 'sublimation' },
  ] },
};

// Reverse lookup so landing on a SUB-chip (e.g. q="blue suit") still
// resolves to the right set, not just the base keyword.
export function findChipSetKey(q: string): string | null {
  const norm = q.trim().toLowerCase();
  if (!norm) return null;
  if (CATEGORY_CHIP_SETS[norm]) return norm;
  for (const [key, set] of Object.entries(CATEGORY_CHIP_SETS)) {
    if (set.chips.some((c) => c.q?.toLowerCase() === norm)) return key;
  }
  return null;
}
