'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Package, BarChart3, Star } from 'lucide-react';

const TABS = [
  { label: 'Design Catalog', href: '/dashboard/catalog', icon: ShoppingBag },
  { label: 'Walk-in Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Analytics', href: '/dashboard/catalog/analytics', icon: BarChart3 },
  { label: 'Reviews', href: '/dashboard/catalog/reviews', icon: Star },
];

/**
 * Module-level tabs that unite the Design Catalog (made-to-order reference
 * listings), Walk-in Orders (quick in-store sales off the catalog), Analytics,
 * and Item Reviews under one unified atelier module.
 */
export default function CatalogModuleTabs() {
  const pathname = usePathname();

  // Pick whichever tab's href is the longest matching prefix
  const activeHref = TABS
    .map(t => t.href)
    .filter(href => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0] || '/dashboard/catalog';

  return (
    <div className="flex items-center gap-6 sm:gap-8 border-b border-line overflow-x-auto hide-scrollbar whitespace-nowrap -mb-px">
      {TABS.map(tab => {
        const active = tab.href === activeHref;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 pb-3.5 pt-1 text-xs sm:text-sm font-bold tracking-tight border-b-2 transition-all whitespace-nowrap shrink-0 -mb-0.5 ${
              active
                ? 'border-taupe text-taupe'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
            }`}
          >
            <Icon size={16} className={active ? 'text-taupe' : 'text-ink-muted'} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

