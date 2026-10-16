import Link from 'next/link';
import { SERVICE_GROUPS, type ServiceGroupKey, canonicalGarment, GARMENTS } from '@/lib/garmentTaxonomy';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';

interface BreadcrumbItem {
  name: string;
  garment_type?: string;
  department?: string | null;
  subcategory?: string | null;
  garment_structure?: string | null;
  store?: { slug?: string; name?: string } | null;
  service?: {
    id?: number;
    name?: string;
    service_category?: string | null;
    showcase_category?: string | null;
  } | null;
}

/**
 * Home > Search > Services > {Service Category} > {Service Name} > {Design Name}
 * Follows the approved Services taxonomy (2026-10-14), matching ServiceDetailBreadcrumb.
 */
export default function CatalogDetailBreadcrumb({ item }: Readonly<{ item: BreadcrumbItem }>) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search' },
    { label: 'Services', href: '/search?tab=services' },
  ];

  // Resolve service category: from item.service or infer from canonical garment
  let categoryKey = item.service?.service_category;
  if (!categoryKey && item.garment_type) {
    const slug = canonicalGarment(item.garment_type);
    if (slug) {
      const cat = GARMENTS[slug]?.category;
      if (cat === 'jerseys_sportswear' || cat === 'uniforms') {
        categoryKey = 'uniform_production';
      } else {
        categoryKey = 'custom_tailoring';
      }
    }
  }

  if (categoryKey && categoryKey in SERVICE_GROUPS) {
    crumbs.push({
      label: SERVICE_GROUPS[categoryKey as ServiceGroupKey].label,
      href: `/search?tab=services&service_category=${categoryKey}`,
    });
  } else if (categoryKey && SERVICE_CATEGORY_LABELS[categoryKey as ServiceCategory]) {
    crumbs.push({
      label: SERVICE_CATEGORY_LABELS[categoryKey as ServiceCategory],
      href: `/search?tab=services&service_category=${categoryKey}`,
    });
  }

  if (item.service?.name) {
    const serviceHref = item.store?.slug && item.service.id
      ? `/store/${item.store.slug}/service/${item.service.id}`
      : `/search?tab=services${categoryKey ? `&service_category=${categoryKey}` : ''}`;
    crumbs.push({ label: item.service.name, href: serviceHref });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-3 overflow-x-auto hide-scrollbar whitespace-nowrap">
      {crumbs.map((crumb) => (
        <span key={`${crumb.label}-${crumb.href}`} className="flex items-center gap-1.5 shrink-0">
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

