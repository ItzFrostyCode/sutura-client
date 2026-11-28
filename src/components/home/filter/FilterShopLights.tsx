import { Clock } from 'lucide-react';
import type { ShopStatusFilter } from '../homeFilters';

interface FilterShopLightsProps {
  readonly value: ShopStatusFilter;
  readonly onChange: (value: ShopStatusFilter) => void;
}

/**
 * "Open now" toggle (the thesis's real-time branch availability). On = open shops only; tap again = all shops.
 * A clock, not a light bulb: a bulb reads as "idea" or "lights", not "open for business".
 */
export default function FilterShopLights({ value, onChange }: FilterShopLightsProps) {
  const on = value === 'open';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="mobile-body-sm text-ink-muted">{on ? 'Open shops only' : 'All shops, open or closed'}</span>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onChange(on ? 'all' : 'open')}
        className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${on ? 'bg-ink text-white' : 'bg-sunken text-ink hover:bg-sunken-hover'}`}
      >
        <Clock size={16} aria-hidden />
        Open now
      </button>
    </div>
  );
}
