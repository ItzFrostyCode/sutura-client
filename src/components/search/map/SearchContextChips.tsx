import { X } from 'lucide-react';
import {
  DEPARTMENT_LABELS, GARMENT_TYPE_LABELS, SERVICE_CATEGORY_LABELS, SERVICE_TYPE_LABELS, SUBCATEGORY_LABELS,
  type Department, type ServiceCategory,
} from '@/lib/canonicalTaxonomy';

interface SearchContextChipsProps {
  readonly department: string;
  readonly subcategory: string;
  readonly garmentType: string;
  readonly serviceCategory: string;
  readonly serviceType: string;
  readonly onClear: () => void;
}

/** Where the person came from (Men › Formal Wear › Suits, or a service). Shown so it is never an invisible filter. */
export default function SearchContextChips({ department, subcategory, garmentType, serviceCategory, serviceType, onClear }: SearchContextChipsProps) {
  const parts = [
    department && (DEPARTMENT_LABELS[department.toLowerCase() as Department] ?? department),
    subcategory && (SUBCATEGORY_LABELS[subcategory] ?? subcategory),
    garmentType && (GARMENT_TYPE_LABELS[garmentType] ?? garmentType),
    serviceCategory && (SERVICE_CATEGORY_LABELS[serviceCategory as ServiceCategory] ?? serviceCategory),
    serviceType && (SERVICE_TYPE_LABELS[serviceType] ?? serviceType),
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <div className="flex min-h-[44px] items-center gap-2 rounded-full bg-sunken pl-4">
      <span className="mobile-body-sm min-w-0 flex-1 truncate text-ink">{parts.join(' › ')}</span>
      <button type="button" onClick={onClear} aria-label="Remove category" className="touch-target-44 flex shrink-0 items-center justify-center text-ink-muted hover:text-ink">
        <X size={16} />
      </button>
    </div>
  );
}
