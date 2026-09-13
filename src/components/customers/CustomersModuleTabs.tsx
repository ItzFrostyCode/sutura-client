'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Ruler } from 'lucide-react';

export type CustomerTabId = 'customers' | 'measurements';

export interface CustomerTabItem {
  id: CustomerTabId;
  label: string;
  href: string;
  icon: React.ElementType;
}

export const CUSTOMER_TABS: readonly CustomerTabItem[] = [
  { id: 'customers', label: 'Client Book', href: '/dashboard/customers', icon: Users },
  { id: 'measurements', label: 'Measurements', href: '/dashboard/measurements', icon: Ruler },
] as const;

interface CustomersModuleTabsProps {
  readonly activeTab?: CustomerTabId;
  readonly className?: string;
}

export default function CustomersModuleTabs({
  activeTab: controlledTab,
  className = '',
}: CustomersModuleTabsProps) {
  const pathname = usePathname();

  const activeId: CustomerTabId = controlledTab ?? (
    pathname.startsWith('/dashboard/measurements') ? 'measurements' : 'customers'
  );

  return (
    <nav
      className={`flex items-center gap-3 sm:gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap -mb-px ${className}`}
      aria-label="Customer Management Navigation"
    >
      {CUSTOMER_TABS.map(tab => {
        const active = tab.id === activeId;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex items-center gap-2 py-3 px-1 text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active
                ? 'text-ink font-bold'
                : 'text-ink-muted hover:text-ink font-medium'
            }`}
          >
            <Icon size={15} className={active ? 'text-ink' : 'text-ink-muted'} />
            <span>{tab.label}</span>

            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-taupe rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
