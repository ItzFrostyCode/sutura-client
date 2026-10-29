'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomeCarouselRow({
  children,
  className = '',
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  // Also re-checks when the cards change (e.g. a filter leaves two), so arrows show only when there is more to scroll to.
  useEffect(() => {
    checkScroll();
  }, [children, checkScroll]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative group/carousel">
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={`flex overflow-x-auto hide-scrollbar gap-3 scroll-smooth snap-x snap-mandatory py-1 ${className}`}
      >
        {children}
      </div>

      {canScrollLeft && (
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface border border-line shadow-md text-ink transition-all z-20 cursor-pointer hover:bg-canvas hover:border-ink active:scale-95"
      >
        <ChevronLeft size={20} />
      </button>
      )}

      {canScrollRight && (
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface border border-line shadow-md text-ink transition-all z-20 cursor-pointer hover:bg-canvas hover:border-ink active:scale-95"
      >
        <ChevronRight size={20} />
      </button>
      )}
    </div>
  );
}
