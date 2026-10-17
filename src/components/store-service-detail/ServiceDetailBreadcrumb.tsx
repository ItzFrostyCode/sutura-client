'use client';

import Link from 'next/link';
import { SERVICE_GROUPS, type ServiceGroupKey } from '@/lib/garmentTaxonomy';
import { serviceHref } from '@/components/categories/categoriesDirectoryData';

interface BreadcrumbItem {
  name: string;
  service_category?: string | null;
}

interface ServiceDetailBreadcrumbProps {
  readonly service: BreadcrumbItem;
  readonly store?: { slug?: string; name?: string } | null;
}

/**
 * Clean store-scoped breadcrumb: Home > Shops > {Store Name} > {Service Category} > {Service Name}.
 * Never loops to Map/Search.
 */
export default function ServiceDetailBreadcrumb({ service, store }: ServiceDetailBreadcrumbProps) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Shops', href: '/shops' },
  ];

  if (store?.name && store?.slug) {
    crumbs.push({ label: store.name, href: `/store/${store.slug}` });
  }

  const key = service.service_category;
  if (key && key in SERVICE_GROUPS) {
    crumbs.push({
      label: SERVICE_GROUPS[key as ServiceGroupKey].label,
      href: store?.slug ? `/store/${store.slug}?tab=services&category=${key}` : serviceHref(key as ServiceGroupKey),
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
      <span className="mobile-caption text-ink font-semibold truncate">{service.name}</span>
    </nav>
  );
}
