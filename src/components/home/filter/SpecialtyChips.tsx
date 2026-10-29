import { Store } from 'lucide-react';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS } from '@/lib/garmentTaxonomy';
import { barChip } from './filterUi';

interface SpecialtyChipsProps {
  readonly value: string;
  readonly onChange: (category: string) => void;
}

/** "All shops" and the garment categories (the same list as Categories), one tap each. "Other Garments" is not a specialty. */
export default function SpecialtyChips({ value, onChange }: SpecialtyChipsProps) {
  const keys = GARMENT_CATEGORY_KEYS.filter((key) => key !== 'other');
  return (
    <div role="group" aria-label="Specialty" className="-mx-3 flex gap-1.5 overflow-x-auto px-3 hide-scrollbar sm:-mx-4 sm:px-4 lg:mx-0 lg:flex-wrap lg:gap-2 lg:overflow-visible lg:px-0">
      <button type="button" aria-pressed={value === ''} onClick={() => onChange('')} className={`${barChip(value === '')} gap-2`}>
        <Store size={14} /> All shops
      </button>
      {keys.map((key) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(value === key ? '' : key)} className={barChip(value === key)}>
          {GARMENT_CATEGORIES[key].label}
        </button>
      ))}
    </div>
  );
}
