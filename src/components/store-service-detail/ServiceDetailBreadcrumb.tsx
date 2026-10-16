import Link from 'next/link';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import { SERVICE_GROUPS, type ServiceGroupKey } from '@/lib/garmentTaxonomy';
import { serviceHref } from '@/components/categories/categoriesDirectoryData';

interface BreadcrumbItem {
  name: string;
  service_category?: string | null;
  service_leaf_type?: string | null;
}

/**
 * Home > Search > {Service Category} > {Service Name} — the 4 approved service groups (2026-10-14).
 */
export default function ServiceDetailBreadcrumb({ service }: Readonly<{ service: BreadcrumbItem }>) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search' },
    { label: 'Services', href: '/search?tab=services' },
  ];
  const key = service.service_category;
  if (key && key in SERVICE_GROUPS) {
    crumbs.push({ label: SERVICE_GROUPS[key as ServiceGroupKey].label, href: serviceHref(key as ServiceGroupKey) });
  } else if (key && SERVICE_CATEGORY_LABELS[key as ServiceCategory]) {
    crumbs.push({ label: SERVICE_CATEGORY_LABELS[key as ServiceCategory], href: `/search?tab=services&service_category=${key}` });
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
