import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import CatalogItemCardSkeleton from '@/components/discovery/CatalogItemCardSkeleton';
import HomeCarouselRow from './HomeCarouselRow';
import type { CatalogItemResult } from '@/types/publicCatalog';

interface HomeShowroomCarouselProps {
  items: CatalogItemResult[];
  loading: boolean;
}

export default function HomeShowroomCarousel({
  items,
  loading,
}: HomeShowroomCarouselProps) {
  return (
    <section aria-labelledby="showroom-catalog-title" className="max-w-7xl mx-auto mobile-screen-margins mt-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="mobile-overline sm:tablet-overline text-taupe">Curated Atelier Creations</p>
          <h2 id="showroom-catalog-title" className="mobile-h2 sm:tablet-h2 text-ink">
            Catalog Designs
          </h2>
        </div>
        <Link
          href="/search"
          className="text-xs font-semibold text-taupe hover:text-taupe-hover min-h-[44px] flex items-center gap-1"
        >
          See all →
        </Link>
      </div>

      {loading && (
        <HomeCarouselRow className="pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[155px] shrink-0">
              <CatalogItemCardSkeleton />
            </div>
          ))}
        </HomeCarouselRow>
      )}

      {!loading && items.length === 0 && (
        <div className="p-8 text-center mobile-body-sm text-ink-muted">
          No catalog designs found yet.
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          {/* Always a horizontal scroll row, even on desktop — matches
              Steam's own carousel rows, which never collapse into a static
              grid at wider widths. */}
          <HomeCarouselRow className="pb-2 items-stretch">
            {items.slice(0, 12).map((item) => (
              <div key={item.id} className="w-[155px] sm:w-[180px] shrink-0 snap-start flex">
                <CatalogItemCard item={item} />
              </div>
            ))}
          </HomeCarouselRow>

          <div className="flex justify-center mt-3 sm:mt-6">
            <Link
              href="/search"
              className="min-h-[44px] h-[48px] px-6 border border-line text-sm font-semibold text-ink hover:border-line-strong hover:bg-sunken transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <SearchIcon size={16} />
              <span>See All in Search</span>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
