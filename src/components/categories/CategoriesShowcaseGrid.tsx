import Link from 'next/link';
import {
  DEPARTMENT_LABELS,
  SUBCATEGORY_LABELS,
  TAXONOMY_TREE,
  type Department,
} from '@/lib/canonicalTaxonomy';

interface ShowcaseTile {
  title: string;
  subtitle: string;
  href: string;
}

function departmentTiles(department: Department): ShowcaseTile[] {
  return Object.keys(TAXONOMY_TREE[department]).map((subcat) => ({
    title: SUBCATEGORY_LABELS[subcat] ?? subcat,
    subtitle: DEPARTMENT_LABELS[department],
    href: `/search?tab=catalog&department=${department}&subcategory=${subcat}`,
  }));
}

// Apparel only — Services have their own dedicated section
// (CategoriesServicesSection.tsx), not mixed into this grid.
const ALL_TILES: ShowcaseTile[] = [
  ...departmentTiles('men'),
  ...departmentTiles('women'),
  ...departmentTiles('children'),
];

export default function CategoriesShowcaseGrid() {
  return (
    <section>
      <h2 className="mobile-h2 sm:tablet-h2 text-ink mb-3">Browse Apparel by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ALL_TILES.map((tile) => (
          <Link
            key={`${tile.subtitle}-${tile.title}`}
            href={tile.href}
            className="min-h-[72px] flex flex-col justify-center gap-0.5 px-4 py-3 bg-surface border border-line hover:border-taupe transition-colors rounded-none"
          >
            <span className="mobile-overline text-ink-faint">{tile.subtitle}</span>
            <span className="mobile-body-md font-semibold text-ink truncate">{tile.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
