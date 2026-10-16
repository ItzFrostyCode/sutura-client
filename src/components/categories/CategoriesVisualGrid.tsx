'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VISUAL_CATEGORIES } from './categoriesDirectoryData';

interface CategoriesVisualGridProps {
  readonly className?: string;
}

export default function CategoriesVisualGrid({ className = '' }: CategoriesVisualGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 350;
    el.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Left Carousel Arrow Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Previous categories"
          className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface border border-line shadow-md text-ink flex items-center justify-center hover:bg-canvas active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft size={18} className="text-ink" />
        </button>
      )}

      {/* Right Carousel Arrow Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Next categories"
          className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface border border-line shadow-md text-ink flex items-center justify-center hover:bg-canvas active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight size={18} className="text-ink" />
        </button>
      )}

      {/* 2-Row Scrollable Grid Container with Rounded Corners */}
      <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-line shadow-xs bg-surface">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="overflow-x-auto hide-scrollbar scroll-smooth"
        >
          <div className="inline-grid min-w-full grid-rows-2 grid-flow-col auto-cols-[120px] sm:auto-cols-[135px] md:auto-cols-[minmax(140px,1fr)]">
            {VISUAL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={cat.href}
                  className="h-[125px] sm:h-[138px] flex flex-col items-center justify-center p-2.5 text-center border-r border-b border-line/60 bg-surface hover:bg-canvas/60 transition-colors group relative cursor-pointer"
                >
                  {/* Visual Circle with Icon */}
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-taupe/10 text-taupe flex items-center justify-center transition-all duration-200 group-hover:scale-108 group-hover:bg-taupe/20 group-hover:text-ink shadow-2xs border border-taupe/15 shrink-0">
                    <Icon size={24} className="sm:w-6 sm:h-6" />
                  </div>

                  {/* Text Label */}
                  <span className="text-xs sm:text-[13px] font-medium text-ink leading-snug line-clamp-2 mt-2 px-1 group-hover:text-taupe transition-colors">
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
