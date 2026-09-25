'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ServiceCarouselRow({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <div className="relative group/carousel">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x snap-mandatory"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="hidden sm:flex absolute -left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center bg-surface border border-line shadow-md hover:border-ink text-ink opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 cursor-pointer"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="hidden sm:flex absolute -right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center bg-surface border border-line shadow-md hover:border-ink text-ink opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 cursor-pointer"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
