import { CUSTOM_SIZE, type GarmentSpecColumn } from '@/components/jobs/jobTypes';
import { AREA_LABEL, areaOf, customParts, OPTIONAL_KEYS, type FitArea } from './rosterHelpers';
import type { RosterMember } from './types';

export const CELL = 'h-11 sm:h-10 w-full rounded-lg border border-espresso/25 bg-white px-2 text-base sm:text-sm text-ink focus:outline-none focus:border-espresso/25 focus:ring-2 focus:ring-espresso/25';

type Part = 'top' | 'bottom';

interface Props {
  readonly column: GarmentSpecColumn;
  readonly row: RosterMember;
  /** 1-based, for the field's spoken name. */
  readonly number: number;
  readonly sizes: string[];
  /** "Chest 38 · Length 28" for a size of the chart, for that part only; empty when the size has no numbers. */
  readonly sizeNumbers: (size: string, part: Part) => string;
  readonly onEdit: (patch: Record<string, string>) => void;
  readonly id?: string;
  /** The option the order is made from fixes what everyone covers. */
  readonly areaLocked?: boolean;
}

/** One size list: a chart size or Custom Fit, with that part's chart numbers underneath. */
function SizeSelect({ id, label, value, sizes, part, sizeNumbers, onPick }: Readonly<{ id?: string; label: string; value: string; sizes: string[]; part: Part; sizeNumbers: Props['sizeNumbers']; onPick: (v: string) => void }>) {
  return (
    <div>
      <select id={id} aria-label={label} required value={value} onChange={(e) => onPick(e.target.value)} className={CELL}>
        <option value="">{label}</option>
        {sizes.map((s) => <option key={s}>{s}</option>)}
      </select>
      {value && value !== CUSTOM_SIZE && sizeNumbers(value, part) && <p className="mt-1 text-[11px] text-ink-muted">{sizeNumbers(value, part)}</p>}
    </div>
  );
}

/**
 * One field of one person on the team list. "Covers" (top, bottom or both) comes first and decides the Size: one size for a top or a
 * bottom, a top size and a bottom size for both. Same on the table and the phone cards.
 */
export default function RosterCell({ column: c, row: r, number, sizes, sizeNumbers, onEdit, id, areaLocked = false }: Props) {
  const area = areaOf(r);

  if (c.key === 'measure_area') {
    return (
      <select id={id} aria-label={`${c.label} ${number}`} required value={area} onChange={(e) => onEdit({ measure_area: e.target.value })} disabled={areaLocked} className={`${CELL} disabled:opacity-70`}>
        <option value="">Top or bottom?</option>
        {(Object.keys(AREA_LABEL) as FitArea[]).map((a) => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
      </select>
    );
  }

  if (c.key === 'size') {
    // A size no longer applies to a measured person once none of their parts is Custom Fit: drop the link to the old profile.
    const pick = (key: 'size' | 'bottom_size') => (v: string) => {
      const patch: Record<string, string> = { [key]: v };
      if (customParts({ ...r, ...patch }).length === 0) patch.measurement_id = '';
      onEdit(patch);
    };
    if (!area) {
      return <select id={id} aria-label={`Size ${number}`} disabled className={`${CELL} disabled:opacity-60`}><option>Choose Covers first</option></select>;
    }
    if (area === 'both') {
      return (
        <div className="space-y-2">
          <SizeSelect id={id} label="Top size" value={r.size ?? ''} sizes={sizes} part="top" sizeNumbers={sizeNumbers} onPick={pick('size')} />
          <SizeSelect label="Bottom size" value={r.bottom_size ?? ''} sizes={sizes} part="bottom" sizeNumbers={sizeNumbers} onPick={pick('bottom_size')} />
        </div>
      );
    }
    return <SizeSelect id={id} label={area === 'top' ? 'Top size' : 'Bottom size'} value={r.size ?? ''} sizes={sizes} part={area} sizeNumbers={sizeNumbers} onPick={pick('size')} />;
  }

  if (c.type === 'select' && (c.options?.length ?? 0) > 0) {
    return (
      <select id={id} aria-label={`${c.label} ${number}`} value={r[c.key] ?? ''} onChange={(e) => onEdit({ [c.key]: e.target.value })} className={CELL}>
        <option value="">{c.label}</option>
        {c.options!.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input
      id={id} aria-label={`${c.label} ${number}`} {...(c.key === 'qty' || c.type === 'number' ? { type: 'number', min: 1, inputMode: 'numeric' as const } : {})}
      required={c.key === 'player_name'} value={r[c.key] ?? ''} onChange={(e) => onEdit({ [c.key]: e.target.value })}
      placeholder={c.key === 'player_name' ? 'Person’s name' : OPTIONAL_KEYS.includes(c.key) ? 'Optional' : c.label} className={CELL}
    />
  );
}
