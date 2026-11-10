import Image from 'next/image';
import HeroSearch from './HeroSearch';

interface HomeHeroProps {
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onOpenFilter: () => void;
  readonly activeFilterCount: number;
}

/**
 * Thesis objective "Shop Discovery: search by specific garment type": one headline that names the garment, one search
 * bar. Nothing else competes with it — tracking, garments and the map each have their own section right below.
 */
export default function HomeHero({ query, onQueryChange, onSubmit, onOpenFilter, activeFilterCount }: HomeHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-espresso">
      <Image src="/images/hero_banner.jpg" alt="" fill priority sizes="(min-width: 1024px) 960px, 100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso via-espresso/85 to-espresso/40" />
      <div className="flex flex-col items-start px-4 py-10 text-left sm:px-10 sm:py-14">
        <p className="mobile-overline text-white/80">Davao City tailoring shops</p>
        <h1 className="mobile-hero-title sm:tablet-hero-title mt-2 max-w-xl text-white">Find the right tailor for your garment.</h1>
        <p className="mobile-body-md mt-3 max-w-lg text-white/85">Search a garment, see verified shops on the map, and follow your order until pickup.</p>
        {/* Full width of the banner, so the search's edges line up with the page margins at every size. */}
        <div className="mt-6 w-full">
          <HeroSearch value={query} onChange={onQueryChange} onSubmit={onSubmit} onOpenFilter={onOpenFilter} activeFilterCount={activeFilterCount} />
        </div>
      </div>
    </section>
  );
}
