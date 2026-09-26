'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search as SearchIcon } from 'lucide-react';
import { getSavedLocation, requestCurrentLocation } from '@/lib/customerLocation';

interface HomeHeroProps {
  heroSearch: string;
  onSearchChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function HomeHero({
  heroSearch,
  onSearchChange,
  onSubmit,
}: HomeHeroProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <section className="relative h-[460px] sm:h-[540px] shrink-0 overflow-hidden">
      <Image
        src="/images/hero_banner.jpg"
        alt="Davao Bespoke Tailoring Studio"
        fill
        priority
        className="object-cover object-center"
      />
      {/* Cinematic directional gradient favoring left-aligned content */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/65 to-ink/35" />

      {/* Left-middle aligned hero content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12">
          <div className="max-w-2xl text-left">
            <p className="mobile-overline sm:tablet-overline text-white/80 mb-2 font-semibold tracking-widest uppercase">
              Davao City &middot; Est. 2026
            </p>
            <h1 className="mobile-hero-title sm:tablet-hero-title text-white mb-3 text-balance">
              Find Your Tailor.<br />Track Every Stitch.
            </h1>
            <p className="mobile-body-sm sm:tablet-body-md text-white/90 mb-6 font-normal leading-relaxed max-w-lg">
              Search verified Davao City tailoring stores by garment, fabric, or repair service.
            </p>

            {/* Completely flat search bar with conditional icon & right search button */}
            <form onSubmit={onSubmit} className="w-full max-w-xl">
              <div className="hero-search-glow flex items-center h-[52px] w-full bg-white border border-white/40 focus-within:border-white rounded-none transition-all">
                {/* Search icon only appears when clicked/focused or active query */}
                {(isFocused || heroSearch.trim().length > 0) && (
                  <div className="pl-4 pr-1 flex items-center shrink-0 animate-in fade-in duration-150">
                    <SearchIcon size={18} className="text-taupe" />
                  </div>
                )}
                <input
                  type="text"
                  value={heroSearch}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search Barong, Chiffon & tulle, Sublimation..."
                  className={`flex-1 min-w-0 bg-transparent text-sm sm:text-base text-ink placeholder:text-ink-faint focus:outline-none font-normal h-full transition-all ${
                    isFocused || heroSearch.trim().length > 0 ? 'px-2' : 'px-4'
                  }`}
                />
                <button
                  type="submit"
                  className="shrink-0 h-full px-5 sm:px-6 bg-ink hover:bg-black text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center justify-center border-l border-line"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
