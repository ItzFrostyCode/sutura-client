'use client';

import React from 'react';
import { Scissors, Layers } from 'lucide-react';

export type ServiceTabId = 'services' | 'packages';

export interface ServiceTabItem {
  id: ServiceTabId;
  label: string;
  icon: React.ElementType;
}

export const SERVICE_TABS: readonly ServiceTabItem[] = [
  { id: 'services', label: 'Individual Services', icon: Scissors },
  { id: 'packages', label: 'Combo Packages', icon: Layers },
] as const;

interface ServicesModuleTabsProps {
  readonly activeTab: ServiceTabId;
  readonly onTabChange: (tabId: ServiceTabId) => void;
  readonly serviceCount?: number;
  readonly packageCount?: number;
  readonly className?: string;
}

export default function ServicesModuleTabs({
  activeTab,
  onTabChange,
  serviceCount,
  packageCount,
  className = '',
}: ServicesModuleTabsProps) {
  return (
    <nav
      className={`flex items-center gap-3 sm:gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap -mb-px ${className}`}
      aria-label="Services Catalog Navigation"
    >
      {SERVICE_TABS.map(tab => {
        const active = tab.id === activeTab;
        const Icon = tab.icon;
        const count = tab.id === 'services' ? serviceCount : packageCount;

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

            {typeof count === 'number' && count > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  active
                    ? 'bg-taupe/15 text-taupe'
                    : 'bg-sunken text-ink-muted'
                }`}
              >
                {count}
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
