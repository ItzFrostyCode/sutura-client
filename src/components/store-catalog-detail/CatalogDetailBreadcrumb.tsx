import Link from 'next/link';
import {
  DEPARTMENT_LABELS,
  GARMENT_STRUCTURE_LABELS,
  GARMENT_TYPE_LABELS,
  SUBCATEGORY_LABELS,
  isDepartment,
  type GarmentStructure,
} from '@/lib/canonicalTaxonomy';

interface BreadcrumbItem {
  name: string;
  garment_type?: string;
  department?: string | null;
  subcategory?: string | null;
  garment_structure?: string | null;
}

/**
 * Home > Search > {Department} > {Subcategory} > {Garment Structure} >
 * {Garment Type} > {Item Name} — the full canonical taxonomy path, built
 * from the item's own department/subcategory/garment_structure/garment_type.
 * Falls back gracefully (fewer crumbs) for an item saved before this
 * taxonomy existed, rather than showing a wrong or invented trail. Takes a
 * minimal structural shape rather than a specific item type, since this
 * page's own `CatalogItem` (../types) and the shared `CatalogItemResult`
 * are two different, incompatible types for the same underlying API resource.
 */
export default function CatalogDetailBreadcrumb({ item }: Readonly<{ item: BreadcrumbItem }>) {
  const department = item.department;
  const crumbs: { label: string; href: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search?tab=catalog' },
  ];

  if (department && isDepartment(department)) {
    const params = new URLSearchParams({ tab: 'catalog', department });
    crumbs.push({ label: DEPARTMENT_LABELS[department], href: `/search?${params.toString()}` });

    if (item.subcategory) {
      params.set('subcategory', item.subcategory);
      crumbs.push({
        label: SUBCATEGORY_LABELS[item.subcategory] ?? item.subcategory,
        href: `/search?${params.toString()}`,
      });

      if (item.garment_structure) {
        params.set('structure', item.garment_structure);
        crumbs.push({
          label: GARMENT_STRUCTURE_LABELS[item.garment_structure as GarmentStructure] ?? item.garment_structure,
          href: `/search?${params.toString()}`,
        });
      }

      if (item.garment_type) {
        params.set('garment_type', item.garment_type);
        crumbs.push({
          label: GARMENT_TYPE_LABELS[item.garment_type] ?? item.garment_type,
          href: `/search?${params.toString()}`,
        });
      }
    }
  } else if (item.garment_type) {
    crumbs.push({
      label: GARMENT_TYPE_LABELS[item.garment_type] ?? item.garment_type,
      href: `/search?tab=catalog&garment_type=${item.garment_type}`,
    });
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
