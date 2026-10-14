import {
  GARMENT_CATEGORIES,
  GARMENTS,
  SERVICE_GROUPS,
  garmentsInCategory,
  type GarmentCategory,
  type ServiceGroupKey,
} from '@/lib/garmentTaxonomy';
import { categoryHref, garmentHref, serviceHref } from '@/components/categories/categoriesDirectoryData';
import type { CategoryLeaf } from './navTypes';

export interface NavItem {
  label: string;
  href: string;
  hex?: string;
}

export interface NavColumn {
  // Distinct from `title` — two columns can legitimately share a blank or
  // repeated title (e.g. Services' 3-way split), but React needs a stable,
  // unique key per column regardless.
  key: string;
  title: string;
  items: NavItem[];
}

/** Splits a list into up to `count` columns of nearly equal length. */
function toColumns(items: NavItem[], count: number, title: string, keyPrefix: string): NavColumn[] {
  const per = Math.ceil(items.length / count);
  return Array.from({ length: count }, (_, i) => items.slice(i * per, (i + 1) * per))
    .filter((chunk) => chunk.length > 0)
    .map((chunk, i) => ({ key: `${keyPrefix}-${i}`, title: i === 0 ? title : '', items: chunk }));
}

/** A garment category's mega-menu: "Browse all" then every garment in it (2-level taxonomy). */
export function getGarmentColumns(category: GarmentCategory): NavColumn[] {
  const items: NavItem[] = [
    { label: `Browse All ${GARMENT_CATEGORIES[category].label}`, href: categoryHref(category) },
    ...garmentsInCategory(category).map((slug) => ({ label: GARMENTS[slug].label, href: garmentHref(slug) })),
  ];
  return toColumns(items, items.length > 6 ? 2 : 1, 'GARMENTS', `garment-${category}`);
}

/** A service's mega-menu: "Browse all" then the tasks shops can tick for it. */
export function getServiceColumns(group: ServiceGroupKey): NavColumn[] {
  const items: NavItem[] = [
    { label: 'Browse All', href: serviceHref(group) },
    ...Object.entries(SERVICE_GROUPS[group].capabilities).map(([slug, cap]) => ({ label: cap.label, href: serviceHref(group, slug) })),
  ];
  return toColumns(items, items.length > 6 ? 2 : 1, 'WHAT THEY DO', `service-${group}`);
}

/**
 * Single dispatch point WebHoverNav/NavMenuDrawer call — keyed on the TopGroup's own `key`
 * (garments/services/discover).
 */
export function getCategoryColumns(groupKey: string, cat?: CategoryLeaf): NavColumn[] {
  if (groupKey === 'discover') return getDiscoverColumns();
  if (groupKey === 'services' && cat?.key && cat.key in SERVICE_GROUPS) return getServiceColumns(cat.key as ServiceGroupKey);
  if (groupKey === 'garments' && cat?.key && cat.key in GARMENT_CATEGORIES) return getGarmentColumns(cat.key as GarmentCategory);
  return [];
}

/**
 * Discover stays a static, link-only mega-menu (no garment taxonomy).
 * Customer and shop entry points are deliberately separate columns: shops
 * sign in with an admin-issued shop login on the Shop tab, never through
 * a customer account.
 */
export function getDiscoverColumns(): NavColumn[] {
  return [
    {
      key: 'explore-sutura',
      title: 'EXPLORE SUTURA',
      items: [
        { label: 'Browse Tailor Map', href: '/map' },
        { label: 'About Sutura', href: '/about' },
        { label: 'Alterations & Repairs', href: '/search?tab=services&service_category=alterations_repairs' },
        { label: 'All Categories Directory', href: '/categories' },
      ],
    },
    {
      key: 'for-customers',
      title: 'FOR CUSTOMERS',
      items: [
        { label: 'My Account', href: '/account' },
        { label: 'Create a Customer Account', href: '/register' },
        { label: 'Track Order', href: '/track' },
      ],
    },
    {
      key: 'for-shops',
      title: 'FOR SHOPS',
      items: [
        { label: 'Shop Sign In', href: '/login?as=store' },
        { label: 'Register a Tailor Store', href: '/register/store' },
      ],
    },
  ];
}
