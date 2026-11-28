'use client';

import Image from 'next/image';
import HeroSearch from './HeroSearch';

interface HomeHeroProps {
  heroSearch: string;
  onSearchChange: (val: string) => void;
  /** Search button / Enter: opens the Map (/search) with the text and the filters picked. */
  onSubmit: (e: React.FormEvent) => void;
  /** The filter button: opens the filter sheet (area, distance, open now, price, rating, sort). */
  onOpenFilter: () => void;
  activeFilterCount: number;
}

export default function HomeHero({
  heroSearch,
  onSearchChange,
  onSubmit,
  onOpenFilter,
  activeFilterCount,
}: HomeHeroProps) {
  return (
    // Only the photo is clipped (not the section), and the section sits above
    // the page below it, so the search suggestions can drop past the hero.
    <section className="relative z-20 min-h-[520px] sm:min-h-[580px] shrink-0 flex items-center">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/hero_banner.jpg"
          alt="A Davao tailor cutting fabric at his workbench"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Even dark wash so centered white text reads over the busy workshop photo */}
        <div className="absolute inset-0 bg-ink/60" />
      </div>

      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-8 py-16 text-center">
        <h1 className="text-display mobile-hero-title sm:tablet-hero-title text-white mb-4 text-balance">
          Discover Davao&rsquo;s Tailoring Shops.
          <br className="hidden sm:block" />{' '}
          From Fitting to Finished Garment.
        </h1>
        <p className="mobile-body-sm sm:tablet-body-md text-white/90 mb-7 font-normal leading-relaxed max-w-xl mx-auto">
          Find local shops, store your measurements, and follow your order&rsquo;s progress.
        </p>

        {/* Search box + filter button + Search button (same bar as the Map's search). */}
        <div className="mx-auto w-full max-w-2xl text-left">
          <HeroSearch value={heroSearch} onChange={onSearchChange} onSubmit={onSubmit} onOpenFilter={onOpenFilter} activeFilterCount={activeFilterCount} />
        </div>

        <p className="mt-3 text-xs sm:text-sm text-white/85">
          Search by Location, Specialty, or Custom Garments in Davao City
        </p>

      </div>
    </section>
  );
}
