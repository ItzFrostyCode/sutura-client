import { Ruler } from 'lucide-react';
import type { MeasureUnit } from '@/lib/measurementUnit';
import FitPointGroup from './FitPointGroup';
import { areaOf, AREA_LABEL, customParts, FIT_PREFIX, isFitArea, type FitFields } from './rosterHelpers';
import type { RosterMember } from './types';

const CELL = 'h-10 w-full rounded-lg border border-espresso/25 bg-white px-2 text-base sm:text-sm text-ink focus:outline-none focus:border-espresso/25 focus:ring-2 focus:ring-espresso/25';

/** A profile this customer already has; only what the panel reads. */
export interface SavedProfile { id: number; profile_name: string; metrics?: Record<string, string | undefined> }

interface Props {
  readonly row: RosterMember;
  /** The customer's current profiles: this person can use one instead of being measured again. */
  readonly profiles?: SavedProfile[];
  readonly who: string;
  /** Measuring points shared by every Custom Fit row, per part. */
  readonly fields: FitFields;
  readonly onFields: (next: FitFields) => void;
  readonly onChange: (patch: Record<string, string>) => void;
  /** The shop's unit; any point can be set to the other one. */
  readonly unit?: MeasureUnit;
}

/**
 * Right under a person who is Custom Fit: type their own measurements. What is measured follows what they cover (picked first)
 * and which of those parts is Custom Fit: a top-only person gets the top points, "top & bottom" with only the bottom Custom gets the bottom points.
 */
export default function CustomFitPanel({ row, profiles = [], who, fields, onFields, onChange, unit = 'in' }: Props) {
  const parts = customParts(row);
  const area = areaOf(row);
  const linked = row.measurement_id ? profiles.find((p) => String(p.id) === row.measurement_id) : undefined;
  const pointsOf = (p: SavedProfile) => Object.entries(p.metrics ?? {}).filter(([k, v]) => !k.startsWith('_') && String(v ?? '').trim() !== '') as [string, string][];
  const known = (name: string) => [...fields.top, ...fields.bottom].some((f) => f.toLowerCase() === name.toLowerCase());
  const addPoint = (part: 'top' | 'bottom') => (name: string) => { if (!known(name)) onFields({ ...fields, [part]: [...fields[part], name] }); };

  // A saved profile that does not cover what this person gets: said plainly, not blocked.
  const savedArea = linked?.metrics?._area;
  const mismatch = linked && area && isFitArea(savedArea) && savedArea !== 'both' && savedArea !== area;

  // Using a saved profile copies its points into this row (for the work ticket) and remembers which profile it is.
  const pickProfile = (id: string) => {
    const picked = profiles.find((p) => String(p.id) === id);
    if (!picked) return onChange({ measurement_id: '' });
    const points = pointsOf(picked);
    const patch: Record<string, string> = { measurement_id: id };
    for (const f of [...fields.top, ...fields.bottom]) patch[FIT_PREFIX + f] = '';
    for (const [k, v] of points) patch[FIT_PREFIX + k] = String(v);
    const part = parts.includes('bottom') && !parts.includes('top') ? 'bottom' : 'top';
    onFields({ ...fields, [part]: [...fields[part], ...points.map(([k]) => k).filter((k) => !known(k))] });
    onChange(patch);
  };

  if (linked) {
    return (
      <div className="col-span-full space-y-2 border-l-2 border-espresso/25 pl-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-espresso"><Ruler size={15} />{who} uses the saved profile “{linked.profile_name}”</p>
        <p className="text-sm text-espresso/70">{pointsOf(linked).map(([k, v]) => `${k} ${v}`).join(' · ') || 'No numbers on this profile.'}</p>
        {mismatch && <p className="text-sm font-medium text-amber-800">This profile has {AREA_LABEL[savedArea as 'top' | 'bottom']} only, but {who} gets {AREA_LABEL[area as 'top' | 'bottom' | 'both']}.</p>}
        <button type="button" onClick={() => onChange({ measurement_id: '' })} className="cursor-pointer text-sm font-medium text-espresso underline underline-offset-2">Measure {who} again instead</button>
      </div>
    );
  }

  return (
    <div className="col-span-full space-y-4 border-l-2 border-espresso/25 pl-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-espresso"><Ruler size={15} />Measurements for {who}{area ? ` · ${AREA_LABEL[area]}` : ''}</p>
      {profiles.length > 0 && (
        <label className="block sm:max-w-sm">
          <span className="mb-1 block text-sm text-espresso">Or use a saved profile of this customer</span>
          <select value="" onChange={(e) => pickProfile(e.target.value)} className={CELL}>
            <option value="">Type new measurements below</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.profile_name}</option>)}
          </select>
        </label>
      )}
      {parts.includes('top') && <FitPointGroup title={parts.length > 1 ? 'Top' : undefined} points={fields.top} row={row} unit={unit} onChange={onChange} onAdd={addPoint('top')} />}
      {parts.includes('bottom') && <FitPointGroup title={parts.length > 1 ? 'Bottom' : undefined} points={fields.bottom} row={row} unit={unit} onChange={onChange} onAdd={addPoint('bottom')} />}
    </div>
  );
}
