import { CONGRESSIONAL_DISTRICTS, barangaysOf } from '@/lib/davaoLocations';
import { areasOf } from '@/lib/davaoAreas';
import type { MoreFilters } from '../homeFilters';
import { chip } from './filterUi';

type Place = Pick<MoreFilters, 'district' | 'barangay' | 'area'>;

interface FilterPlaceProps {
  readonly value: Place;
  readonly onChange: (patch: Partial<Place>) => void;
}

const title = 'mobile-h4 mb-3 text-ink';

/**
 * Where: Davao City's 11 districts (grouped by congressional district) → one of the district's official barangays,
 * and the district's streets, malls and landmarks (davaoAreas.ts). A street is never a district value; it searches
 * the shops' addresses (StoreBranch::placeFilter on the server).
 */
export default function FilterPlace({ value, onChange }: FilterPlaceProps) {
  const pickDistrict = (district: string) => onChange({ district, barangay: '', area: '' });
  const barangays = barangaysOf(value.district);
  const areas = areasOf(value.district);

  return (
    <section className="mt-6">
      <h3 className={title}>District</h3>
      <button type="button" aria-pressed={!value.district} onClick={() => pickDistrict('')} className={chip(!value.district)}>All of Davao City</button>
      {Object.entries(CONGRESSIONAL_DISTRICTS).map(([nth, districts]) => (
        <div key={nth} className="mt-4">
          <p className="mobile-overline mb-2 text-ink-faint">{nth} Congressional District</p>
          <div className="flex flex-wrap gap-2">
            {districts.map((d) => (
              <button key={d} type="button" aria-pressed={value.district === d} onClick={() => pickDistrict(value.district === d ? '' : d)} className={chip(value.district === d)}>{d}</button>
            ))}
          </div>
        </div>
      ))}

      {value.district && (
        <>
          <label htmlFor="filter-barangay" className={`${title} mt-6 block`}>Barangay</label>
          <select
            id="filter-barangay"
            value={value.barangay}
            onChange={(e) => onChange({ barangay: e.target.value })}
            className="h-12 w-full rounded-2xl bg-sunken px-4 text-base text-ink focus:outline-none focus:ring-2 focus:ring-line-strong"
          >
            <option value="">All barangays in {value.district}</option>
            {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          {areas.length > 0 && (
            <>
              <h3 className={`${title} mt-6`}>Streets &amp; landmarks</h3>
              <p className="mobile-caption -mt-2 mb-3 text-ink-muted">Shops whose address mentions the place you pick.</p>
              <div className="flex flex-wrap gap-2">
                {areas.map((a) => (
                  <button key={a.label} type="button" aria-pressed={value.area === a.match} onClick={() => onChange({ area: value.area === a.match ? '' : a.match })} className={chip(value.area === a.match)}>{a.label}</button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
