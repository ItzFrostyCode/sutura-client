import Link from 'next/link';
import { BriefcaseBusiness, Crown, Drama, Flower2, GraduationCap, Ruler, Shirt, Sparkles, Trophy, Wind, type LucideIcon } from 'lucide-react';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, type GarmentCategory } from '@/lib/garmentTaxonomy';
import { categoryHref } from '@/components/categories/categoriesDirectoryData';
import HomeSectionHeader from './HomeSectionHeader';

// Shortcuts into the garment categories (2-level taxonomy, 2026-10-14) — what a customer wants made, altered or
// fixed. No Men / Women / Kids: who wears it is not how a tailor's work is found. Services have their own section
// further down the page.
const ICONS: Record<Exclude<GarmentCategory, 'other'>, LucideIcon> = {
  barong: Sparkles,
  traditional: Flower2,
  uniforms: GraduationCap,
  jerseys_sportswear: Trophy,
  dresses_gowns: Crown,
  formal_wear: BriefcaseBusiness,
  shirts_tops: Shirt,
  pants_bottoms: Ruler,
  outerwear: Wind,
  costumes: Drama,
};

const CATEGORIES = GARMENT_CATEGORY_KEYS.filter((c): c is Exclude<GarmentCategory, 'other'> => c !== 'other');

export default function HomeCategories() {
  return (
    <section aria-labelledby="home-categories-title">
      <HomeSectionHeader id="home-categories-title" title="Categories" href="/categories" />
      {/* Phones: one row that scrolls sideways; from 600px: a 5-column grid (2 rows). */}
      <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-1 hide-scrollbar min-[600px]:mx-0 min-[600px]:grid min-[600px]:grid-cols-5 min-[600px]:gap-4 min-[600px]:overflow-visible min-[600px]:px-0">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat];
          return (
            <Link
              key={cat}
              href={categoryHref(cat)}
              className="card-soft flex min-h-[104px] w-[112px] shrink-0 snap-start flex-col items-center justify-center gap-2.5 px-2 text-center transition-transform active:scale-[0.97] min-[600px]:w-auto"
            >
              <Icon size={26} className="text-taupe" />
              <span className="line-clamp-2 text-sm font-medium leading-tight text-ink">{GARMENT_CATEGORIES[cat].label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
