import Link from 'next/link';
import { BriefcaseBusiness, ChevronRight, Crown, Flower2, GraduationCap, Ruler, Shirt, Sparkles, Trophy, type LucideIcon } from 'lucide-react';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS } from '@/lib/garmentTaxonomy';

// Same icons as All Categories (categoriesDirectoryData). Kept here so the map's search needs only the taxonomy.
const ICONS: Record<string, LucideIcon> = {
  barong: Sparkles,
  traditional: Flower2,
  uniforms: GraduationCap,
  jerseys_sportswear: Trophy,
  dresses_gowns: Crown,
  formal_wear: BriefcaseBusiness,
  shirts_tops: Shirt,
  pants_bottoms: Ruler,
};

/** The 8 garment tiles of Discover's "Browse by garment" (the first 8 garment categories; no services). */
const GARMENT_TILES = GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other').slice(0, 8).map((id) => ({
  id,
  label: GARMENT_CATEGORIES[id].label,
  icon: ICONS[id] ?? Shirt,
}));
const searchWordOf = (id: string) => (GARMENT_CATEGORIES as Record<string, { aliases: readonly string[]; label: string }>)[id]?.aliases[0] ?? id;

interface GarmentTilesProps {
  /** Search for a garment (a tile was tapped). */
  readonly onSearch: (term: string) => void;
  readonly title?: string;
}

/** "Browse by garment" + All categories, then the icon + text tiles from Discover (2 per row). */
export default function GarmentTiles({ onSearch, title = 'Browse by garment' }: GarmentTilesProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="mobile-h4 text-ink">{title}</h3>
        <Link href="/categories" className="flex min-h-11 items-center gap-1 text-sm font-semibold text-taupe-dark hover:text-ink">
          All categories <ChevronRight size={16} aria-hidden />
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {GARMENT_TILES.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSearch(searchWordOf(id))}
              className="flex h-full min-h-14 w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:border-taupe-dark"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sunken text-taupe-dark" aria-hidden>
                <Icon size={18} />
              </span>
              <span className="mobile-body-sm min-w-0 break-words font-medium text-ink">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
