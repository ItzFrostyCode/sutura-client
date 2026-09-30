// Thin wrapper around src/lib/canonicalTaxonomy.ts (the single source of
// truth for the Department -> Subcategory -> Garment Structure -> Garment
// Type hierarchy) adapted into {value,label} option lists the cascading
// <select>s in BasicInfoSection.tsx map over directly. Superseded the old
// flat CATALOG_GARMENT_CATEGORIES/CATALOG_DEPARTMENTS enums (10-value
// garment-type list, men/women/wedding/office departments) during the
// canonical taxonomy migration (2026-09-29).
import {
  Department,
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  GarmentStructure,
  SUBCATEGORY_LABELS,
  GARMENT_STRUCTURE_LABELS,
  GARMENT_TYPE_LABELS,
  subcategoriesFor,
  structuresFor,
  garmentTypesFor,
} from '@/lib/canonicalTaxonomy';

export interface CatalogOption {
  value: string;
  label: string;
}

/** Subcategory key shared by every department's safety-valve entry. */
export const CATALOG_OTHERS_SUBCATEGORY = 'others';

export const CATALOG_DEPARTMENTS: CatalogOption[] = DEPARTMENTS.map(d => ({
  value: d,
  label: DEPARTMENT_LABELS[d],
}));

export function catalogSubcategoryOptions(department: Department): CatalogOption[] {
  return subcategoriesFor(department).map(s => ({ value: s, label: SUBCATEGORY_LABELS[s] ?? s }));
}

// "Others" has no structures of its own in the taxonomy, but a design filed
// there is still a top, a bottom, a set or a one-piece — so offer the four.
// ('Other' stays selectable only for a design that already has it.)
const OTHERS_STRUCTURES: GarmentStructure[] = ['top_wear', 'bottom_wear', 'sets', 'one_piece'];

export function catalogStructureOptions(department: Department, subcategory: string, current?: string): CatalogOption[] {
  const structures: GarmentStructure[] = subcategory === CATALOG_OTHERS_SUBCATEGORY
    ? [...OTHERS_STRUCTURES, ...(current === 'other' ? (['other'] as GarmentStructure[]) : [])]
    : structuresFor(department, subcategory);
  return structures.map(s => ({ value: s, label: GARMENT_STRUCTURE_LABELS[s] }));
}

export function catalogGarmentTypeOptions(department: Department, subcategory: string, structure: GarmentStructure): CatalogOption[] {
  return garmentTypesFor(department, subcategory, structure).map(t => ({ value: t, label: GARMENT_TYPE_LABELS[t] ?? t }));
}
