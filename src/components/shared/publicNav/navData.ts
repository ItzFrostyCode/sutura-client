import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, SERVICE_GROUPS, SERVICE_GROUP_KEYS } from '@/lib/garmentTaxonomy';
import type { TopGroup } from './navTypes';

// Header menu, 2-level taxonomy (2026-10-14): Garments (10 categories → garments) · Services (4 → tasks) · Discover.
// No Men / Women / Kids — who wears a garment is not how a tailor's work is found.
export const TOP_GROUPS: TopGroup[] = [
  {
    key: 'garments',
    label: 'Garments',
    categories: GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other').map((cat) => ({ label: GARMENT_CATEGORIES[cat].label, key: cat })),
  },
  {
    key: 'services',
    label: 'Services',
    categories: SERVICE_GROUP_KEYS.map((group) => ({ label: SERVICE_GROUPS[group].label, key: group })),
  },
  {
    key: 'discover',
    label: 'Discover',
    categories: [],
    links: [
      { href: '/map', label: 'Browse Map' },
      { href: '/account', label: 'My Account' },
      { href: '/login?as=store', label: 'Shop Sign In' },
      { href: '/register/store', label: 'Register a Store' },
      { href: '/about', label: 'About Sutura' },
      { href: '/search?tab=services&service_category=alterations_repairs', label: 'Alterations & Repairs' },
      { href: '/categories', label: 'All Categories Directory' },
    ],
  },
];
