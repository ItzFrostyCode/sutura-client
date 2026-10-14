import Link from 'next/link';
import { GARMENT_CATEGORIES, GARMENTS, canonicalGarment } from '@/lib/garmentTaxonomy';
import { categoryHref, garmentHref } from '@/components/categories/categoriesDirectoryData';

interface BreadcrumbItem {
  name: string;
  garment_type?: string;
  department?: string | null;
  subcategory?: string | null;
  garment_structure?: string | null;
}

/**
 * Home > Search > {Garment Category} > {Garment} > {Design} — the 2-level taxonomy (2026-10-14). An old 4-level slug
 * resolves to the garment it was merged into; a typed-in name shows under "Other Garments". Takes a minimal
 * structural shape since this page's own `CatalogItem` and the shared `CatalogItemResult` are different types for
 * the same API resource.
 */
export default function CatalogDetailBreadcrumb({ item }: Readonly<{ item: BreadcrumbItem }>) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search?tab=catalog' },
  ];
  const slug = canonicalGarment(item.garment_type);
  if (slug) {
    const cat = GARMENTS[slug].category;
    crumbs.push({ label: GARMENT_CATEGORIES[cat].label, href: categoryHref(cat) });
    crumbs.push({ label: GARMENTS[slug].label, href: garmentHref(slug) });
  } else if (item.garment_type) {
    crumbs.push({ label: item.garment_type, href: `/search?q=${encodeURIComponent(item.garment_type)}` });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-3 overflow-x-auto hide-scrollbar whitespace-nowrap">
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5 shrink-0">
          <Link href={crumb.href} className="mobile-caption text-ink-muted hover:text-ink">
            {crumb.label}
          </Link>
          <span className="mobile-caption text-ink-faint">/</span>
        </span>
      ))}
      <span className="mobile-caption text-ink font-semibold truncate">{item.name}</span>
    </nav>
  );
}
