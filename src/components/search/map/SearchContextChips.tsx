import { X } from 'lucide-react';
import { GARMENT_TYPE_LABELS, SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import { SERVICE_GROUPS, capabilityLabel, garmentLabel, type ServiceGroupKey } from '@/lib/garmentTaxonomy';

interface SearchContextChipsProps {
  readonly department: string;
  readonly subcategory: string;
  readonly garmentType: string;
  readonly serviceCategory: string;
  readonly serviceType: string;
  readonly onClear: () => void;
}

/**
 * Where the person came from (a garment, a service, a task). Shown so it is never an invisible filter. Men / Women /
 * Kids and subcategories from an old link are not filters any more, so they are not shown either.
 */
export default function SearchContextChips({ garmentType, serviceCategory, serviceType, onClear }: SearchContextChipsProps) {
  const group = serviceCategory in SERVICE_GROUPS ? SERVICE_GROUPS[serviceCategory as ServiceGroupKey].label : null;
  const parts = [
    garmentType && (garmentLabel(garmentType) ?? GARMENT_TYPE_LABELS[garmentType] ?? garmentType),
    serviceCategory && (group ?? SERVICE_CATEGORY_LABELS[serviceCategory as ServiceCategory] ?? serviceCategory),
    serviceType && capabilityLabel(serviceCategory, serviceType),
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
