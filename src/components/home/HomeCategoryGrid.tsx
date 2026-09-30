'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  SUBCATEGORY_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  subcategoriesFor,
  serviceSearchHref,
  type Department,
} from '@/lib/canonicalTaxonomy';
import HomeCarouselRow from './HomeCarouselRow';
import HomeCategoryCard from './HomeCategoryCard';
import { getCategoryVisual, getServiceCategoryVisual } from './homeCategoryData';
import type { CatalogItemResult } from '@/types/publicCatalog';

interface HomeCategoryGridProps {
  readonly items?: CatalogItemResult[];
}

type ActiveTab = Department | 'services';
const TABS: { key: ActiveTab; label: string }[] = [
  ...DEPARTMENTS.map((d) => ({ key: d as ActiveTab, label: DEPARTMENT_LABELS[d] })),
  { key: 'services', label: 'Services' },
];

// 'others' is every department's safety-valve catch-all subcategory (see
// canonicalTaxonomy.ts), not a real browsable category — excluded the same
// way this grid already deliberately excludes Accessories below.
function subcategoryTilesFor(department: Department) {
  return subcategoriesFor(department)
    .filter((sub) => sub !== 'others')
    .map((sub) => ({ value: sub, label: SUBCATEGORY_LABELS[sub] ?? sub }));
}

export default function HomeCategoryGrid({}: HomeCategoryGridProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(TABS[0].key);

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

      {/* Category Tabs — Men's/Women's/Children's Apparel + Services */}
      <div className="flex items-center justify-start sm:justify-center gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1 px-1">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 min-h-[44px] px-5 py-2.5 rounded-none text-xs sm:text-sm font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-ink text-white border-ink'
                  : 'bg-surface text-ink-muted border-line hover:border-ink hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Carousel of High-Definition Category Visual Cards — one per
          subcategory under the active department, or one per service
          category when the Services tab is active. */}
      <HomeCarouselRow className="pb-4">
        {activeTab === 'services'
          ? SERVICE_CATEGORIES.filter((cat) => cat !== 'others').map((cat, idx) => (
              <HomeCategoryCard
                key={`services-${cat}`}
                href={serviceSearchHref(cat)}
                category={{ value: cat, label: SERVICE_CATEGORY_LABELS[cat] }}
                visual={getServiceCategoryVisual(cat)}
                isPriority={idx < 3}
              />
            ))
          : subcategoryTilesFor(activeTab).map((sub, idx) => {
              const visual = getCategoryVisual(activeTab, sub.value);

              return (
                <HomeCategoryCard
                  key={`${activeTab}-${sub.value}`}
                  href={`/search?tab=catalog&department=${encodeURIComponent(activeTab)}&subcategory=${encodeURIComponent(sub.value)}`}
                  category={sub}
                  visual={visual}
                  isPriority={idx < 3}
                />
              );
            })}
      </HomeCarouselRow>

      <div className="text-center mt-2">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-sm font-semibold text-taupe hover:text-ink transition-colors"
        >
          All Categories <ChevronRight size={15} />
        </Link>
      </div>
    </section>
  );
}
