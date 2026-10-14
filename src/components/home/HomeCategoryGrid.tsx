'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, SERVICE_GROUPS, SERVICE_GROUP_KEYS } from '@/lib/garmentTaxonomy';
import { categoryHref, serviceHref } from '@/components/categories/categoriesDirectoryData';
import HomeCarouselRow from './HomeCarouselRow';
import HomeCategoryCard from './HomeCategoryCard';
import { getGarmentCategoryVisual, getServiceCategoryVisual } from './homeCategoryData';
import type { CatalogItemResult } from '@/types/publicCatalog';

interface HomeCategoryGridProps {
  readonly items?: CatalogItemResult[];
}

// Garments (the 10 garment categories) and Services (the 4 approved services) — no Men / Women / Kids (2026-10-14).
type ActiveTab = 'garments' | 'services';
const TABS: { key: ActiveTab; label: string }[] = [
  { key: 'garments', label: 'Garments' },
  { key: 'services', label: 'Services' },
];

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

      {/* Category Tabs — Garments + Services */}
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

      {/* Carousel of category cards — one per garment category, or one per service on the Services tab. */}
      <HomeCarouselRow className="pb-4">
        {activeTab === 'services'
          ? SERVICE_GROUP_KEYS.map((group, idx) => (
              <HomeCategoryCard
                key={`services-${group}`}
                href={serviceHref(group)}
                category={{ value: group, label: SERVICE_GROUPS[group].label }}
                visual={getServiceCategoryVisual(group)}
                isPriority={idx < 3}
              />
            ))
          : GARMENT_CATEGORY_KEYS.filter((cat) => cat !== 'other').map((cat, idx) => (
              <HomeCategoryCard
                key={`garments-${cat}`}
                href={categoryHref(cat)}
                category={{ value: cat, label: GARMENT_CATEGORIES[cat].label }}
                visual={getGarmentCategoryVisual(cat)}
                isPriority={idx < 3}
              />
            ))}
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
