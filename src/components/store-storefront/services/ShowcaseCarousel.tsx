'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ShowcaseCarouselProps {
  readonly label: string;
  readonly children: React.ReactNode;
  /** Re-measure pages when the slide set changes. */
  readonly resetKey?: string | number;
}

/**
 * Horizontal snap carousel for the storefront Services tab: arrows on the
 * sides (sm+), page dots underneath, native swipe on touch. A "page" is one
 * viewport-width of slides, so the dots match what you can actually see.
 */
export default function ShowcaseCarousel({ label, children, resetKey }: ShowcaseCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const count = Math.max(1, Math.ceil((el.scrollWidth - 4) / el.clientWidth));
    setPages(count);
    setPage(Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [measure, resetKey]);

  const goTo = (target: number) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: target * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  };

  const atStart = page <= 0;
  const atEnd = page >= pages - 1;
  const arrow =
    'absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-[0_2px_8px_rgba(45,42,38,0.12)] transition-opacity duration-200 hover:border-ink disabled:pointer-events-none disabled:opacity-0 sm:flex cursor-pointer';

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <button type="button" onClick={() => goTo(page - 1)} disabled={atStart} aria-label="Previous" className={`${arrow} -left-5`}>
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      <div
        ref={trackRef}
        onScroll={measure}
        className="flex snap-x snap-mandatory gap-3 sm:gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-1"
      >
        {children}
      </div>

      <button type="button" onClick={() => goTo(page + 1)} disabled={atEnd} aria-label="Next" className={`${arrow} -right-5`}>
        <ChevronRight size={20} aria-hidden="true" />
      </button>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Page ${i + 1} of ${pages}`}
              aria-current={i === page}
              className="flex h-6 items-center px-0.5 cursor-pointer"
            >
              <span className={`block h-2 rounded-full transition-all duration-300 ease-out ${i === page ? 'w-6 bg-ink' : 'w-2 bg-line-strong hover:bg-ink-muted'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
