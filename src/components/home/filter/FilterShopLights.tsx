import { Lightbulb, LightbulbOff } from 'lucide-react';
import type { ShopStatusFilter } from '../homeFilters';
import { chip } from './filterUi';

interface FilterShopLightsProps {
  readonly value: ShopStatusFilter;
  readonly onChange: (value: ShopStatusFilter) => void;
}

const LIGHTS = [
  { key: 'open', label: 'Open', Icon: Lightbulb },
  { key: 'closed', label: 'Closed', Icon: LightbulbOff },
] as const;

/**
 * Two lights, not a switch: a lit bulb for shops that are open, an unlit one for shops that are closed.
 * Tap a light to turn it on, tap it again to turn it off. With both off, every shop is shown.
 */
export default function FilterShopLights({ value, onChange }: FilterShopLightsProps) {
  return (
    <div>
      <div className="flex gap-3">
        {LIGHTS.map(({ key, label, Icon }) => {
          const on = value === key;
          return (
            <button key={key} type="button" aria-pressed={on} onClick={() => onChange(on ? 'all' : key)} className={`${chip(on)} flex-1`}>
              <Icon size={20} className={on && key === 'open' ? 'fill-current' : ''} />
              {label}
            </button>
          );
        })}
      </div>
      <p className="mobile-caption mt-2 text-ink-muted">Both off shows every shop.</p>
    </div>
  );
}
