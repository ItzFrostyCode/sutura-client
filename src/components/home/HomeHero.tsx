import Image from 'next/image';
import { MapPin, Package, Ruler } from 'lucide-react';
import HeroSearch from './HeroSearch';

interface HomeHeroProps {
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onOpenFilter: () => void;
  readonly activeFilterCount: number;
}

/**
 * Outlined but not a button. The row never wraps: type, padding and gaps shrink with the width of the row itself (container
 * query units), the icons go below 360px, and only on a very narrow phone does a label fold onto a second line (all cells stay the same height).
 */
const feature = 'flex min-w-0 flex-auto items-center justify-center gap-1.5 rounded-lg border border-white/30 px-[clamp(6px,2.5cqw,12px)] py-2 text-center text-[clamp(9px,2.6cqw,14px)] leading-tight text-white/85 @min-[420px]:whitespace-nowrap';
const icon = 'shrink-0 @max-[360px]:hidden';

/** Banner with the headline and the search bar. The filter icon opens price and district; the quick filters sit under "Shops near you". */
export default function HomeHero({ query, onQueryChange, onSubmit, onOpenFilter, activeFilterCount }: HomeHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-espresso">
      <Image src="/images/hero_banner.jpg" alt="" fill priority sizes="(min-width: 1024px) 960px, 100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso via-espresso/85 to-espresso/30" />
      <div className="flex flex-col items-start px-4 py-12 text-left sm:px-10 sm:py-16">
        <h1 className="mobile-hero-title sm:tablet-hero-title text-white">Discover Davao&rsquo;s <span className="whitespace-nowrap">tailoring shops.</span></h1>
        <p className="mobile-body-md mt-3 text-white/80">Explore tailoring services, store your measurements, and follow your order&rsquo;s progress.</p>
        <div className="mt-6 w-full max-w-xl">
          <HeroSearch value={query} onChange={onQueryChange} onSubmit={onSubmit} onOpenFilter={onOpenFilter} activeFilterCount={activeFilterCount} />
          <p className="mobile-caption mt-2 text-white/70">Search by shop, garment or service in Davao City.</p>
        </div>
        <div className="@container mt-6 w-full max-w-xl">
          <ul className="flex flex-nowrap items-stretch gap-[clamp(4px,1.5cqw,12px)]">
            <li className={feature}><MapPin size={14} className={icon} /> Map-based discovery</li>
            <li className={feature}><Ruler size={14} className={icon} /> Saved measurements</li>
            <li className={feature}><Package size={14} className={icon} /> Order tracking</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
