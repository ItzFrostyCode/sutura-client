import { X } from 'lucide-react';
import { capabilityLabel, garmentLabel, serviceGroupLabel } from '@/lib/garmentTaxonomy';

interface SearchContextChipsProps {
  readonly department?: string;
  readonly subcategory?: string;
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
  const parts = [
    garmentType && (garmentLabel(garmentType) ?? garmentType),
    serviceCategory && (serviceGroupLabel(serviceCategory) ?? serviceCategory),
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
