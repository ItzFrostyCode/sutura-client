'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingBag, BarChart3 } from 'lucide-react';

// Reviews used to be its own top-level tab — merged into Analytics as a
// section (with the rest of the charts/KPIs) instead, since it had no
// numbers of its own worth a whole separate destination.
export type CatalogTabId = 'catalog' | 'analytics';

export interface CatalogTabItem {
  id: CatalogTabId;
  label: string;
  href: string;
  icon: typeof ShoppingBag;
}

export const CATALOG_TABS: readonly CatalogTabItem[] = [
  { id: 'catalog', label: 'Designs', href: '/dashboard/catalog', icon: ShoppingBag },
  { id: 'analytics', label: 'Analytics', href: '/dashboard/catalog/analytics', icon: BarChart3 },
] as const;

interface CatalogModuleTabsProps {
  readonly activeTab?: CatalogTabId;
  readonly onTabChange?: (tabId: CatalogTabId, href: string) => void;
  readonly className?: string;
}

export default function CatalogModuleTabs({
  activeTab: controlledTab,
  onTabChange,
  className = '',
}: CatalogModuleTabsProps) {
  const pathname = usePathname();

  const activeId: CatalogTabId = controlledTab ?? (
    pathname.includes('/analytics') || pathname.includes('/reviews')
      ? 'analytics'
      : 'catalog'
  );

  return (
    <nav
      className={`flex items-center gap-3 sm:gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap -mb-px ${className}`}
      aria-label="Catalog Showcase Navigation"
    >
      {CATALOG_TABS.map(tab => {
        const active = tab.id === activeId;
        const Icon = tab.icon;
        return (
          <a
            key={tab.id}
            href={tab.href}
            onClick={e => {
              if (onTabChange) {
                e.preventDefault();
                onTabChange(tab.id, tab.href);
              }
            }}
            aria-current={active ? 'page' : undefined}
            className={`relative flex items-center gap-2 py-3 px-1 text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active
                ? 'text-ink font-bold'
                : 'text-ink-muted hover:text-ink font-medium'
            }`}
          >
            <Icon size={15} className={active ? 'text-ink' : 'text-ink-muted'} />
            <span>{tab.label}</span>

            {/* Bottom stroke line resting right on the header divider line */}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-taupe rounded-full" />
            )}
          </a>
        );
      })}
    </nav>
  );
}
