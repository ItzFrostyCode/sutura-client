'use client';

import React from 'react';
import { Scissors, ShoppingBag } from 'lucide-react';

export type OrderTabId = 'custom_jobs' | 'showroom_sales';

interface OrdersModuleTabsProps {
  readonly activeTab: OrderTabId;
  readonly onTabChange: (tabId: OrderTabId) => void;
  readonly customJobsCount?: number;
  readonly showroomSalesCount?: number;
  readonly className?: string;
}

export default function OrdersModuleTabs({
  activeTab,
  onTabChange,
  customJobsCount,
  showroomSalesCount,
  className = '',
}: OrdersModuleTabsProps) {
  const tabs = [
    {
      id: 'custom_jobs' as const,
      label: 'Production Pipeline',
      icon: Scissors,
      count: customJobsCount,
    },
    {
      id: 'showroom_sales' as const,
      label: 'Showroom Sales Archive',
      icon: ShoppingBag,
      count: showroomSalesCount,
    },
  ];

  return (
    <nav
      className={`flex items-center gap-3 sm:gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap -mb-px ${className}`}
      aria-label="Orders Navigation"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={active ? 'page' : undefined}
            className={`relative flex items-center gap-2 py-3 px-1 text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active
                ? 'text-ink font-bold'
                : 'text-ink-muted hover:text-ink font-medium'
            }`}
          >
            <Icon size={15} className={active ? 'text-ink' : 'text-ink-muted'} />
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                  active
                    ? 'bg-taupe text-white'
                    : 'bg-canvas text-ink-muted border border-line'
                }`}
              >
                {tab.count}
              </span>
            )}

            {/* Bottom stroke line resting right on the header divider line */}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-taupe rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
