'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, MessageCircleQuestion, Ruler, Search as SearchIcon, Spool, type LucideIcon } from 'lucide-react';
import type { SavedLocation } from '@/lib/customerLocation';
import HomeLocationStatus from './HomeLocationStatus';
import type { LocationStatus } from './useHomeData';

interface HomeHeroProps {
  heroSearch: string;
  onSearchChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  locationStatus: LocationStatus;
  location: SavedLocation | null;
}

// What SUTURA does for a customer (thesis objectives 4 & 6), each a
// shortcut to where that happens, plus Ask SUTURA (adviser request).
const FEATURES: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Map-Based Discovery', href: '/map', icon: MapPin },
  { label: 'Secure Measurements', href: '/account/measurements', icon: Ruler },
  { label: 'Order Progress Tracking', href: '/track', icon: Spool },
  { label: 'Ask SUTURA', href: '/ask', icon: MessageCircleQuestion },
];

export default function HomeHero({
  heroSearch,
  onSearchChange,
  onSubmit,
  locationStatus,
  location,
}: HomeHeroProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <section className="relative min-h-[520px] sm:min-h-[580px] shrink-0 overflow-hidden flex items-center">
      <Image
        src="/images/hero_banner.jpg"
        alt="A Davao tailor cutting fabric at his workbench"
        fill
        priority
        className="object-cover object-center"
      />
      {/* Even dark wash so centered white text reads over the busy workshop photo */}
      <div className="absolute inset-0 bg-ink/60" />

      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-8 py-16 text-center">
        <HomeLocationStatus status={locationStatus} location={location} />
        <h1 className="text-display mobile-hero-title sm:tablet-hero-title text-white mb-4 text-balance">
          Discover Davao&rsquo;s Tailoring Shops.
          <br className="hidden sm:block" />{' '}
          From Fitting to Finished Garment.
        </h1>
        <p className="mobile-body-sm sm:tablet-body-md text-white/90 mb-7 font-normal leading-relaxed max-w-xl mx-auto">
          Find local shops, store your measurements, and follow your order&rsquo;s progress.
        </p>

        <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto" role="search">
          <div className="hero-search-glow flex items-center h-[52px] sm:h-[56px] w-full bg-white border border-white/40 focus-within:border-white rounded-none transition-all">
            {(isFocused || heroSearch.trim().length > 0) && (
              <div className="pl-4 pr-1 flex items-center shrink-0 animate-in fade-in duration-150">
                <SearchIcon size={18} className="text-taupe" aria-hidden="true" />
              </div>
            )}
            <input
              type="text"
              value={heroSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search tailors, garments or specializations"
              placeholder="Search tailors, garments (e.g., Barong, Chiffon), or specializations..."
              className={`flex-1 min-w-0 bg-transparent text-sm sm:text-base text-ink placeholder:text-ink-faint focus:outline-none font-normal h-full transition-all ${
                isFocused || heroSearch.trim().length > 0 ? 'px-2' : 'px-4'
              }`}
            />
            <button
              type="submit"
              className="shrink-0 h-full px-5 sm:px-7 bg-ink hover:bg-black text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center justify-center border-l border-line"
            >
              Search
            </button>
          </div>
        </form>

        <p className="mt-3 text-xs sm:text-sm text-white/85">
          Search by Location, Specialty, or Custom Garments in Davao City
        </p>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {FEATURES.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                className="inline-flex min-h-10 items-center gap-2 border border-white/25 bg-white/10 px-3.5 py-2 text-xs sm:text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Icon size={16} className="text-[#E8D9C9]" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
