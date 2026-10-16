'use client';

import { DEFAULT_RADIUS_KM, MAX_RADIUS_KM, MIN_RADIUS_KM, RADIUS_STEP_KM } from '../homeFilters';

interface FilterDistanceProps {
  /** null = Any distance (toggle OFF — slider grayed out) */
  readonly radiusKm: number | null;
  readonly onChange: (radiusKm: number | null) => void;
}

/**
 * Slider is ALWAYS visible.
 * Toggle OFF → null (any distance), slider is grayed / disabled.
 * Toggle ON  → slider is active and the chosen km radius is applied.
 */
export default function FilterDistance({ radiusKm, onChange }: FilterDistanceProps) {
  const isActive = radiusKm !== null;
  const sliderValue = isActive ? radiusKm : DEFAULT_RADIUS_KM;

  function handleToggle() {
    onChange(isActive ? null : DEFAULT_RADIUS_KM);
  }

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    // Sliding always turns the toggle ON
    onChange(Number(e.target.value));
  }

  return (
    <div>
      {/* Label + toggle */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="mobile-body-sm text-ink-muted">
          {isActive ? `Within ${sliderValue} km` : 'Any distance'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={handleToggle}
          className={[
            'relative h-7 w-12 shrink-0 overflow-hidden rounded-full transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taupe',
            isActive ? 'bg-ink' : 'bg-ink/20',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-[4px] left-[4px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
              isActive ? 'translate-x-[20px]' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Slider — always rendered, grayed when toggle is OFF */}
      <div className={isActive ? '' : 'opacity-40 pointer-events-none'}>
        <input
          type="range"
          aria-label="Distance in kilometers"
          min={MIN_RADIUS_KM}
          max={MAX_RADIUS_KM}
          step={RADIUS_STEP_KM}
          value={sliderValue}
          onChange={handleSlider}
          className="h-11 w-full accent-taupe"
          disabled={!isActive}
        />
        <div className="mobile-caption flex justify-between text-ink-muted">
          <span>{MIN_RADIUS_KM} km</span>
          <span>{MAX_RADIUS_KM} km</span>
        </div>
      </div>
    </div>
  );
}
