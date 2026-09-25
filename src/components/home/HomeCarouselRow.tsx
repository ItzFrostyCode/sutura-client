'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Shared horizontal-scroll-with-arrows shell — the one interaction pattern
// Steam's whole storefront repeats across every row (Discounts & Events,
// Top New Releases, Under ₱400, etc.). Mobile keeps native touch-scroll
// (arrows hidden, same as Steam's own mobile site); sm+ shows hover arrows
// that scroll by one viewport-width at a time.
export default function HomeCarouselRow({
  children,
  className = '',
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.85 : el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className="relative group/carousel">
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto hide-scrollbar gap-3 scroll-smooth snap-x snap-mandatory ${className}`}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 items-center justify-center bg-surface border border-line hover:border-ink text-ink opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 cursor-pointer"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 items-center justify-center bg-surface border border-line hover:border-ink text-ink opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 cursor-pointer"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
