import SpecialtyChips from './filter/SpecialtyChips';
import QuickFilters from './filter/QuickFilters';
import type { AllFilters } from './homeFilters';

interface HomeFilterBarProps {
  readonly value: AllFilters;
  readonly onChange: (value: AllFilters) => void;
}

/** Always-visible filters for Near Shops: what the shop does, then open now / rating / distance. Changes show in the list right below. */
export default function HomeFilterBar({ value, onChange }: HomeFilterBarProps) {
  return (
    <div className="mb-4 space-y-3 rounded-xl border border-line bg-surface p-3 sm:p-4 lg:space-y-4 lg:p-5">
      <SpecialtyChips value={value.category ?? ''} onChange={(category) => onChange({ ...value, category })} />
      <div className="border-t border-line pt-3 lg:pt-4">
        <QuickFilters value={value} onChange={onChange} />
      </div>
    </div>
  );
}
