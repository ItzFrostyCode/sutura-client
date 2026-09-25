'use client';

import React from 'react';
import { Shirt, ShoppingBag, Star, Sparkles } from 'lucide-react';

export type CatalogDetailTab = 'overview' | 'orders' | 'reviews' | 'recommendations';

interface CatalogDetailTabsNavProps {
  activeTab: CatalogDetailTab;
  onSelectTab: (tab: CatalogDetailTab) => void;
  ordersCount: number;
  reviewsCount: number;
  recommendationsCount: number;
}

export default function CatalogDetailTabsNav({
  activeTab,
  onSelectTab,
  ordersCount,
  reviewsCount,
  recommendationsCount,
}: CatalogDetailTabsNavProps) {
  const tabs = [
    { id: 'overview' as const, label: 'Overview & Design Specs', icon: Shirt },
    { id: 'orders' as const, label: `Orders & Sales (${ordersCount})`, icon: ShoppingBag },
    { id: 'reviews' as const, label: `Reviews & Ratings (${reviewsCount})`, icon: Star },
    { id: 'recommendations' as const, label: `Related Items (${recommendationsCount})`, icon: Sparkles },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-line pb-2 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
  );
}
