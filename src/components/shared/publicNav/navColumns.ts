import {
  type Department,
  type ServiceCategory,
  GARMENT_STRUCTURE_LABELS,
  GARMENT_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  garmentSearchHref,
  garmentTypesFor,
  isDepartment,
  serviceSearchHref,
  serviceTypesFor,
  structuresFor,
} from '@/lib/canonicalTaxonomy';
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

/**
 * Mega-menu columns for a Men/Women/Children subcategory — one column per
 * garment structure (Top Wear/Bottom Wear/Sets/One-Piece) present under
 * that subcategory, each item linking straight to /search with the full
 * department/subcategory/structure/garment_type filter chain. Where
 * Categories.md defines no leaf garment types yet (e.g. Children's Apparel,
 * Women's Costumes & Performance), the column falls back to a single
 * "Browse All {Structure}" link instead of rendering empty.
 *
 * No COLOR column here — color isn't part of the canonical taxonomy
 * (Categories.md explicitly keeps it a per-item attribute/filter, not a
 * category), and it's already free text the shop owner sets per catalog
 * item, not a fixed palette worth baking into the nav.
 */
export function getTaxonomyColumns(department: Department, subcategoryKey: string): NavColumn[] {
  const structures = structuresFor(department, subcategoryKey);

  // When NONE of this subcategory's structures have real leaf data yet
  // (Kids' subcategories, Women's Costumes & Performance), rendering one
  // near-empty "Browse All {Structure}" column per structure looked sparse
  // and broken next to Men/Women's richly-populated columns — collapse to
  // a single tidy column instead.
  const allEmpty = structures.every((s) => garmentTypesFor(department, subcategoryKey, s).length === 0);
  if (allEmpty) {
    return [{
      key: 'browse',
      title: 'BROWSE',
      items: structures.map((structure) => ({
        label: `Browse All ${GARMENT_STRUCTURE_LABELS[structure]}`,
        href: garmentSearchHref(department, subcategoryKey, structure),
      })),
    }];
  }

  return structures.map((structure) => {
    const types = garmentTypesFor(department, subcategoryKey, structure);
    const structureLabel = GARMENT_STRUCTURE_LABELS[structure];

    return {
      key: structure,
      title: structureLabel.toUpperCase(),
      items: types.length > 0
        ? types.map((type) => ({
            label: GARMENT_TYPE_LABELS[type] ?? type,
            href: garmentSearchHref(department, subcategoryKey, structure, type),
          }))
        : [{
            label: `Browse All ${structureLabel}`,
            href: garmentSearchHref(department, subcategoryKey, structure),
          }],
    };
  });
}

/**
 * Mega-menu columns for a Services category — leaf service types split
 * across 3 columns (rather than one long single column, which left the
 * rest of the mega-menu's width empty) linking to /search?tab=services
 * with the service_category/service_type filter chain.
 */
export function getServiceColumns(serviceCategoryKey: ServiceCategory): NavColumn[] {
  const types = serviceTypesFor(serviceCategoryKey);
  const items = [
    { label: 'Browse All', href: serviceSearchHref(serviceCategoryKey) },
    ...types.map((type) => ({
      label: SERVICE_TYPE_LABELS[type] ?? type,
      href: serviceSearchHref(serviceCategoryKey, type),
    })),
  ];

  const columnCount = 3;
  const perColumn = Math.ceil(items.length / columnCount);

  return Array.from({ length: columnCount }, (_, i) => items.slice(i * perColumn, (i + 1) * perColumn))
    .filter((chunk) => chunk.length > 0)
    .map((chunk, i) => ({ key: `service-col-${i}`, title: i === 0 ? 'SERVICE TYPES' : '', items: chunk }));
}

/**
 * Single dispatch point WebHoverNav/NavMenuDrawer call — keyed on the
 * TopGroup's own `key` (men/women/children/services/discover), routing to
 * the right generator above instead of the old per-category-label
 * if/else chain.
 */
export function getCategoryColumns(groupKey: string, cat?: CategoryLeaf): NavColumn[] {
  if (groupKey === 'discover') return getDiscoverColumns();
  if (groupKey === 'services') return cat?.key ? getServiceColumns(cat.key as ServiceCategory) : [];
  if (isDepartment(groupKey) && cat?.key) return getTaxonomyColumns(groupKey, cat.key);
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
        { label: 'About Sutura', href: '/#about' },
        { label: 'Alterations & Repairs', href: '/search?q=Alterations&category=alteration_repair' },
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
