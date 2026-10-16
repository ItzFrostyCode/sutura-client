'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FilterChipsProps {
  readonly options: readonly { key: string; label: string; count?: number }[];
  readonly active: string;
  readonly onChange: (key: string) => void;
  readonly label: string;
  readonly className?: string;
  readonly showArrows?: boolean;
}

/**
 * A responsive, horizontally-scrollable row of soft round chips.
 * - Supports mouse drag-to-scroll on desktop/laptop.
 * - Responsive left/right arrow buttons when content overflows.
 * - Native touch momentum scrolling on mobile/tablet.
 * - Smooth auto-centering of the active chip.
 */
export default function FilterChips({
  options,
  active,
  onChange,
  label,
  className = '',
  showArrows = true,
}: FilterChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse drag state
  const isDown = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        checkScroll();
      });
      ro.observe(el);
    }

    window.addEventListener('resize', checkScroll);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, options]);

  // Auto-scroll active item into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLElement>('[aria-selected="true"]');
    if (activeBtn) {
      const btnLeft = activeBtn.offsetLeft;
      const btnRight = btnLeft + activeBtn.offsetWidth;
      const visibleLeft = el.scrollLeft;
      const visibleRight = el.scrollLeft + el.clientWidth;
      if (btnLeft < visibleLeft + 40 || btnRight > visibleRight - 40) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    checkScroll();
  }, [active, checkScroll]);

  // Global mousemove and mouseup listeners to ensure smooth drag even outside container
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDown.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const x = e.pageX - el.offsetLeft;
      const walk = x - startX.current;
      if (Math.abs(walk) > 4) {
        if (!hasDragged.current) {
          hasDragged.current = true;
          setIsDraggingState(true);
        }
        el.scrollLeft = startScrollLeft.current - walk;
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDown.current) {
        isDown.current = false;
        setIsDraggingState(false);
        setTimeout(() => {
          hasDragged.current = false;
        }, 80);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleArrowScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(220, Math.floor(el.clientWidth * 0.65));
    el.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDown.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - el.offsetLeft;
    startScrollLeft.current = el.scrollLeft;
  };

  return (
    <div className={`relative group w-full ${className}`}>
      {/* Left Arrow Button & subtle gradient fade */}
      {showArrows && canScrollLeft && (
        <div className="absolute left-0 inset-y-0 z-20 flex items-center pr-3 pointer-events-none bg-gradient-to-r from-canvas via-canvas/90 to-transparent">
          <button
            type="button"
            onClick={() => handleArrowScroll('left')}
            aria-label="Scroll categories left"
            className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface/95 backdrop-blur-xs border border-line shadow-xs text-ink flex items-center justify-center hover:bg-canvas hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}

      {/* Right Arrow Button & subtle gradient fade */}
      {showArrows && canScrollRight && (
        <div className="absolute right-0 inset-y-0 z-20 flex items-center pl-3 pointer-events-none bg-gradient-to-l from-canvas via-canvas/90 to-transparent">
          <button
            type="button"
            onClick={() => handleArrowScroll('right')}
            aria-label="Scroll categories right"
            className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface/95 backdrop-blur-xs border border-line shadow-xs text-ink flex items-center justify-center hover:bg-canvas hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Scrollable & Draggable Container */}
      <div
        ref={scrollRef}
        role="tablist"
        aria-label={label}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        className={`hide-scrollbar flex gap-2 overflow-x-auto py-1 scroll-smooth touch-pan-x select-none ${
          isDraggingState ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
      >
        {options.map((o) => {
          const on = active === o.key;
          return (
            <button
              key={o.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                if (hasDragged.current) return;
                onChange(o.key);
              }}
              className={`relative h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm transition-colors before:absolute before:inset-x-0 before:-inset-y-1 cursor-pointer ${
                on
                  ? 'bg-ink font-semibold text-white'
                  : 'bg-sunken text-ink-muted hover:bg-sunken-hover hover:text-ink'
              }`}
            >
              {o.label}
              {o.count !== undefined && (
                <span className={`ml-1.5 ${on ? 'text-white/70' : 'text-ink-faint'}`}>{o.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
