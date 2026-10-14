import { DEFAULT_RADIUS_KM, MAX_RADIUS_KM, MIN_RADIUS_KM, RADIUS_STEP_KM } from '../homeFilters';
import { chip } from './filterUi';

interface FilterDistanceProps {
  /** null = Auto */
  readonly radiusKm: number | null;
  readonly onChange: (radiusKm: number | null) => void;
}

/** Auto (nearest first, anywhere in Davao) or a range of 5 to 50 km. */
export default function FilterDistance({ radiusKm, onChange }: FilterDistanceProps) {
  const auto = radiusKm === null;

  return (
    <div>
      <div className="flex gap-3">
        <button type="button" onClick={() => onChange(null)} aria-pressed={auto} className={`${chip(auto)} flex-1`}>Auto</button>
        <button type="button" onClick={() => onChange(radiusKm ?? DEFAULT_RADIUS_KM)} aria-pressed={!auto} className={`${chip(!auto)} flex-1`}>
          {MIN_RADIUS_KM}–{MAX_RADIUS_KM} km
        </button>
      </div>
      {auto ? (
        <p className="mobile-body-sm mt-3 text-ink-muted">Nearest first, across all of Davao City.</p>
      ) : (
        <div className="mt-3">
          <p className="mobile-body-md mb-1 text-ink">Within <span className="font-semibold">{radiusKm} km</span></p>
          <input
            type="range"
            aria-label="Distance in kilometers"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            step={RADIUS_STEP_KM}
            value={radiusKm ?? DEFAULT_RADIUS_KM}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-11 w-full accent-taupe"
          />
          <div className="mobile-caption flex justify-between text-ink-muted"><span>{MIN_RADIUS_KM} km</span><span>{MAX_RADIUS_KM} km</span></div>
        </div>
      )}
    </div>
  );
}
