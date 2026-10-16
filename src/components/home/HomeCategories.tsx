import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import CategoriesVisualGrid from '@/components/categories/CategoriesVisualGrid';

export default function HomeCategories() {
  return (
    <section aria-labelledby="home-categories-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="home-categories-title" className="text-sm sm:text-base font-bold tracking-wider uppercase text-ink">
          CATEGORIES
        </h2>
        <Link
          href="/categories"
          className="text-xs sm:text-sm font-semibold text-taupe hover:text-ink transition-colors flex items-center gap-1 group"
        >
          <span>See All Categories</span>
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <CategoriesVisualGrid />
    </section>
  );
}
