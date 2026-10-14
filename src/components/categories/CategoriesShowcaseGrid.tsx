import Link from 'next/link';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, GARMENTS, garmentsInCategory } from '@/lib/garmentTaxonomy';
import { categoryHref, garmentHref } from './categoriesDirectoryData';

// Browse by Garment Category: the 10 categories, each with its garments as tags (2 levels — no Men / Women / Kids,
// no top/bottom). "Other Garments" has no fixed list, so it is not a tile.
export default function CategoriesShowcaseGrid() {
  return (
    <section>
      <h2 className="mobile-h2 sm:tablet-h2 text-ink mb-3">Browse by Garment Category</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other').map((cat) => (
          <div key={cat} className="bg-surface border border-line p-4">
            <Link href={categoryHref(cat)} className="mobile-h4 text-ink hover:text-taupe transition-colors">
              {GARMENT_CATEGORIES[cat].label}
            </Link>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {garmentsInCategory(cat).map((slug) => (
                <Link
                  key={slug}
                  href={garmentHref(slug)}
                  className="mobile-caption min-h-8 inline-flex items-center px-2.5 py-1 bg-canvas border border-line hover:border-taupe hover:text-taupe transition-colors text-ink-muted"
                >
                  {GARMENTS[slug].label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
