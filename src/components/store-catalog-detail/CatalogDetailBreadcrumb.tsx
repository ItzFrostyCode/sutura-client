'use client';

import Link from 'next/link';
import { SERVICE_GROUPS, type ServiceGroupKey, canonicalGarment, GARMENTS } from '@/lib/garmentTaxonomy';

interface BreadcrumbItem {
  name: string;
  garment_type?: string;
  store?: { slug?: string; name?: string } | null;
  service?: {
    id?: number;
    name?: string;
    service_category?: string | null;
  } | null;
}

/**
 * Clean store-scoped breadcrumb: Home > Shops > {Store Name} > {Service Name} > {Design Name}
 * Never loops to Map/Search.
 */
export default function CatalogDetailBreadcrumb({ item }: Readonly<{ item: BreadcrumbItem }>) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Shops', href: '/shops' },
  ];

  if (item.store?.name && item.store?.slug) {
    crumbs.push({ label: item.store.name, href: `/store/${item.store.slug}` });
  }

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

  if (item.service?.name) {
    const serviceHref = item.store?.slug && item.service.id
      ? `/store/${item.store.slug}/service/${item.service.id}`
      : item.store?.slug
        ? `/store/${item.store.slug}?tab=services`
        : '/shops';
    crumbs.push({ label: item.service.name, href: serviceHref });
  } else if (categoryKey && categoryKey in SERVICE_GROUPS) {
    crumbs.push({
      label: SERVICE_GROUPS[categoryKey as ServiceGroupKey].label,
      href: item.store?.slug ? `/store/${item.store.slug}?tab=services&category=${categoryKey}` : '/categories',
    });
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
