import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SUBCATEGORY_LABELS,
  subcategoriesFor,
} from '@/lib/canonicalTaxonomy';
import type { TopGroup } from './navTypes';

function departmentGroup(key: 'men' | 'women' | 'children', label: string): TopGroup {
  return {
    key,
    label,
    categories: subcategoriesFor(key).map((subcat) => ({
      label: SUBCATEGORY_LABELS[subcat] ?? subcat,
      key: subcat,
    })),
  };
}

export const TOP_GROUPS: TopGroup[] = [
  departmentGroup('men', 'Men'),
  departmentGroup('women', 'Women'),
  departmentGroup('children', 'Kids'),
  {
    key: 'services',
    label: 'Services',
    categories: SERVICE_CATEGORIES.map((cat) => ({
      label: SERVICE_CATEGORY_LABELS[cat],
      key: cat,
    })),
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
      { href: '/#about', label: 'About Sutura' },
      { href: '/search?q=alteration', label: 'Alterations & Repairs' },
      { href: '/categories', label: 'All Categories Directory' },
    ],
  },
];
