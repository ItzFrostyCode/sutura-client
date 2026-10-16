import { Lightbulb } from 'lucide-react';
import type { ShopStatusFilter } from '../homeFilters';

interface FilterShopLightsProps {
  readonly value: ShopStatusFilter;
  readonly onChange: (value: ShopStatusFilter) => void;
}

/**
 * Open toggle with label text.
 * Active = open shops only. Tap again = show all shops.
 */
export default function FilterShopLights({ value, onChange }: FilterShopLightsProps) {
  const on = value === 'open';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="mobile-body-sm text-ink-muted">
        {on ? 'Open shops only' : 'All shops'}
      </span>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onChange(on ? 'all' : 'open')}
        className={[
          'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors',
          on ? 'bg-ink text-white' : 'bg-sunken text-ink hover:bg-sunken-hover',
        ].join(' ')}
      >
        <Lightbulb size={15} className={on ? 'fill-current' : ''} />
        Open
      </button>
    </div>
  );
}
