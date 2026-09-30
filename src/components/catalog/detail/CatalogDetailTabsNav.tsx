'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Shirt, ShoppingBag, Star, ChevronLeft, ChevronRight } from 'lucide-react';

export type CatalogDetailTab = 'overview' | 'orders' | 'reviews';

interface CatalogDetailTabsNavProps {
  activeTab: CatalogDetailTab;
  onSelectTab: (tab: CatalogDetailTab) => void;
  ordersCount: number;
  reviewsCount: number;
  /** Services have no per-item order history yet. */
  showOrders?: boolean;
}

export default function CatalogDetailTabsNav({
  activeTab,
  onSelectTab,
  ordersCount,
  reviewsCount,
  showOrders = true,
}: CatalogDetailTabsNavProps) {
  const tabs = [
    { id: 'overview' as const, label: 'Overview & Design Specs', icon: Shirt },
    ...(showOrders ? [{ id: 'orders' as const, label: `Orders & Sales (${ordersCount})`, icon: ShoppingBag }] : []),
    { id: 'reviews' as const, label: `Ratings (${reviewsCount})`, icon: Star },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Arrows only exist while there is more strip to reveal in that direction:
  // ">" disappears once the last tab is in view, "<" appears after scrolling.
  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateArrows, ordersCount, reviewsCount]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  const arrowClass =
    'absolute top-0 z-10 w-9 h-10 bg-white border border-line text-ink flex items-center justify-center shadow-sm hover:bg-sunken cursor-pointer';

  return (
    <div className="relative border-b border-line pb-2">
      {canScrollLeft && (
        <button type="button" onClick={() => scrollByDir(-1)} aria-label="Scroll tabs left" className={`${arrowClass} left-0.5`}>
          <ChevronLeft size={18} />
        </button>
      )}
      {canScrollRight && (
        <button type="button" onClick={() => scrollByDir(1)} aria-label="Scroll tabs right" className={`${arrowClass} right-0.5`}>
          <ChevronRight size={18} />
        </button>
      )}
      <div ref={scrollRef} onScroll={updateArrows} className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              isActive
                ? 'bg-taupe text-white shadow-xs'
                : 'bg-white text-ink-muted hover:text-ink hover:bg-canvas border border-line'
            }`}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
