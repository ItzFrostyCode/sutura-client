'use client';

import { useState } from 'react';
import { SEARCH_DEPARTMENTS } from '@/lib/navSearchCategories';
import HomeCarouselRow from './HomeCarouselRow';
import HomeCategoryCard from './HomeCategoryCard';
import { getCategoryVisual } from './homeCategoryData';
import type { CatalogItemResult } from '@/types/publicCatalog';

interface HomeCategoryGridProps {
  readonly items?: CatalogItemResult[];
}

const DEPARTMENTS = SEARCH_DEPARTMENTS.filter((d) => d.key !== 'all');

export default function HomeCategoryGrid({}: HomeCategoryGridProps) {
  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0].key);
  const dept = DEPARTMENTS.find((d) => d.key === activeDept) ?? DEPARTMENTS[0];

  return (
    <section aria-labelledby="category-grid-title" className="max-w-7xl mx-auto mobile-screen-margins mt-12 sm:mt-16">
      {/* Section Header */}
      <div className="text-center mb-6 sm:mb-8">
        <p className="mobile-overline text-taupe mb-1.5 uppercase tracking-widest">
          Curated Garments
        </p>
        <h2 id="category-grid-title" className="mobile-h2 sm:tablet-h2 text-ink">
          Shop by Category
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto mt-1.5">
          Explore handcrafted bespoke apparel, made-to-measure tailoring, and custom designs across Davao City.
        </p>
      </div>

      {/* Department Tabs */}
      <div className="flex items-center justify-start sm:justify-center gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1 px-1">
        {DEPARTMENTS.map((d) => {
          const isActive = d.key === activeDept;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setActiveDept(d.key)}
              className={`shrink-0 min-h-[44px] px-5 py-2.5 rounded-none text-xs sm:text-sm font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-ink text-white border-ink'
                  : 'bg-surface text-ink-muted border-line hover:border-ink hover:text-ink'
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Carousel of High-Definition Category Visual Cards.
          Accessories deliberately excluded here — kept minor (search-only,
          via /search's own filter) rather than given landing-page-card
          prominence, since no shop actually lists real accessory items
          yet (ties/cufflinks are sourced, not tailored) and no real photo
          exists to represent it honestly. */}
      <HomeCarouselRow className="pb-4">
        {dept.categories.filter((cat) => cat.value !== 'accessories').map((cat, idx) => {
          const visual = getCategoryVisual(dept.key, cat.value);

          return (
            <HomeCategoryCard
              key={`${dept.key}-${cat.value}`}
              departmentKey={dept.key}
              departmentLabel={dept.label}
              category={cat}
              visual={visual}
              isPriority={idx < 3}
            />
          );
        })}
      </HomeCarouselRow>
    </section>
  );
}
