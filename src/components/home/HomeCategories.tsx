import Link from 'next/link';
import HomeSectionHeader from './HomeSectionHeader';
import { VISUAL_CATEGORIES } from '@/components/categories/categoriesDirectoryData';

/** VISUAL_CATEGORIES lists the 10 garment categories first, then the 4 services: the landing page shows garments only. */
const GARMENTS = VISUAL_CATEGORIES.slice(0, 8);

/**
 * Thesis objective "search by specific garment type": eight garment tiles, one tap each to the shops that make it.
 * Garments only (the services — alterations, customization… — are on All Categories), so no two tiles mean the same thing.
 *
 * On a phone the icon sits ABOVE the name: side by side, a 320px screen left ~60px for "Jerseys & Sportswear" and the
 * words spilled out of the tile. From 640px there is room for the icon beside the name.
 */
export default function HomeCategories() {
  return (
    <section aria-labelledby="home-garments-title">
      <HomeSectionHeader id="home-garments-title" title="Browse by garment" href="/categories" linkLabel="All categories" />
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {GARMENTS.map(({ id, label, href, icon: Icon }) => (
          <li key={id}>
            <Link
              href={href}
              className="group flex h-full min-h-16 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-2 py-3 text-center transition-colors hover:border-taupe-dark sm:flex-row sm:justify-start sm:gap-3 sm:px-3 sm:py-2 sm:text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sunken text-taupe-dark" aria-hidden>
                <Icon size={20} />
              </span>
              <span className="mobile-body-sm min-w-0 break-words font-medium text-ink group-hover:text-taupe-dark">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
