import {
  DEPARTMENT_LABELS,
  GARMENT_STRUCTURE_LABELS,
  GARMENT_TYPE_LABELS,
  SERVICE_CATEGORY_LABELS,
  SERVICE_TYPE_LABELS,
  SUBCATEGORY_LABELS,
  SERVICES_TREE,
  TAXONOMY_TREE,
  type Department,
  type ServiceCategory,
} from '@/lib/canonicalTaxonomy';

export interface DirectoryEntry {
  letter: string;
  label: string;
  breadcrumb: string;
  href: string;
}

function garmentEntries(department: Department): DirectoryEntry[] {
  const entries: DirectoryEntry[] = [];
  for (const [subcat, structures] of Object.entries(TAXONOMY_TREE[department])) {
    for (const [structure, types] of Object.entries(structures)) {
      for (const type of types ?? []) {
        const label = GARMENT_TYPE_LABELS[type] ?? type;
        entries.push({
          letter: label.charAt(0).toUpperCase(),
          label,
          breadcrumb: `${DEPARTMENT_LABELS[department]} / ${SUBCATEGORY_LABELS[subcat] ?? subcat} / ${GARMENT_STRUCTURE_LABELS[structure as keyof typeof GARMENT_STRUCTURE_LABELS] ?? structure}`,
          href: `/search?tab=catalog&department=${department}&subcategory=${subcat}&structure=${structure}&garment_type=${type}`,
        });
      }
    }
  }
  return entries;
}

function serviceEntries(): DirectoryEntry[] {
  const entries: DirectoryEntry[] = [];
  for (const [cat, types] of Object.entries(SERVICES_TREE) as [ServiceCategory, string[]][]) {
    for (const type of types) {
      const label = SERVICE_TYPE_LABELS[type] ?? type;
      entries.push({
        letter: label.charAt(0).toUpperCase(),
        label,
        breadcrumb: `Services / ${SERVICE_CATEGORY_LABELS[cat]}`,
        href: `/search?tab=services&service_category=${cat}&service_type=${type}`,
      });
    }
  }
  return entries;
}

// Apparel only (Men/Women/Children) — Services get their own dedicated
// section (CategoriesServicesSection.tsx) instead of being folded into this
// alphabetical list, since a service is a different kind of thing than a
// garment and mixing them here made Services impossible to browse as a
// group on their own.
export function buildDirectoryEntries(): DirectoryEntry[] {
  const entries = [
    ...garmentEntries('men'),
    ...garmentEntries('women'),
    ...garmentEntries('children'),
  ];
  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

export { serviceEntries };

export function groupByLetter(entries: DirectoryEntry[]): Map<string, DirectoryEntry[]> {
  const map = new Map<string, DirectoryEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.letter) ?? [];
    list.push(entry);
    map.set(entry.letter, list);
  }
  return map;
}

export const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
