'use client';

import React from 'react';
import { Shirt, ShoppingBag, Star } from 'lucide-react';
import ScrollNav from '@/components/shared/ScrollNav';

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

  return (
    <div className="border-b border-line pb-2">
      <ScrollNav className="flex items-center gap-2">
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
      </ScrollNav>
    </div>
  );
}
