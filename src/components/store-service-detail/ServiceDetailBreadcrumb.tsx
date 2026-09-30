import Link from 'next/link';
import { SERVICE_CATEGORY_LABELS, SERVICE_TYPE_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';

interface BreadcrumbItem {
  name: string;
  service_category?: string | null;
  service_leaf_type?: string | null;
}

/**
 * Home > Search > Services > {Service Category} > {Service Type} > {Service Name} —
 * mirrors CatalogDetailBreadcrumb.tsx's exact pattern, using the Services
 * taxonomy (2 levels: category → type) instead of the apparel one (4
 * levels). Falls back to just Home > Search for a service saved before
 * this taxonomy existed, rather than showing a wrong or invented trail.
 */
export default function ServiceDetailBreadcrumb({ service }: Readonly<{ service: BreadcrumbItem }>) {
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search?tab=services' },
    { label: 'Services', href: '/search?tab=services' },
  ];

  const category = service.service_category as ServiceCategory | null | undefined;
  if (category && SERVICE_CATEGORY_LABELS[category]) {
    const params = new URLSearchParams({ tab: 'services', service_category: category });
    crumbs.push({ label: SERVICE_CATEGORY_LABELS[category], href: `/search?${params.toString()}` });

    if (service.service_leaf_type) {
      params.set('service_type', service.service_leaf_type);
      crumbs.push({
        label: SERVICE_TYPE_LABELS[service.service_leaf_type] ?? service.service_leaf_type,
        href: `/search?${params.toString()}`,
      });
    }
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
