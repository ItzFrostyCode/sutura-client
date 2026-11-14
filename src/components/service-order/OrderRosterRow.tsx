'use client';

import { Trash2 } from 'lucide-react';
import { CUSTOM_FIT, customArea, type RosterRow } from './useOrderForm';
import OrderPointInputs from './OrderPointInputs';
import { Segments } from './orderUi';
import type { Area, Unit } from './orderPoints';
import { CUTS, CUT_COLUMN } from './useMeasureColumns';

const FIELD = 'h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-base text-ink focus:border-ink focus:outline-none';
const PARTS: readonly { value: Area; label: string }[] = [
  { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'both', label: 'Set' },
];

/**
 * One person on a Group order: name, the shop's own columns (Jersey Number…), what they get (when the option does not
 * decide it), their size(s), and — for Custom Fit — their measurements in the unit chosen for the whole group.
 */
export default function OrderRosterRow({ row, index, area, partChoosable, gets, columns, sizes, unit, sized, allowCustom, canRemove, onChange, onRemove }: Readonly<{
  row: RosterRow; index: number; area: Area | ''; partChoosable: boolean; gets?: React.ReactNode; columns: string[]; sizes: readonly string[];
  unit: Unit | ''; sized: boolean; allowCustom: boolean; canRemove: boolean; onChange: (patch: Partial<RosterRow>) => void; onRemove: () => void;
}>) {
  const n = index + 1;
  const name = row.name.trim();
  const custom = row.size === CUSTOM_FIT || row.bottomSize === CUSTOM_FIT;
  const options = allowCustom ? [...sizes, CUSTOM_FIT] : [...sizes];
  const sizeSelect = (id: string, label: string, value: string, key: 'size' | 'bottomSize') => (
    <div className="min-w-0">
      <label htmlFor={id} className="mobile-caption mb-1 block text-ink-muted">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange({ [key]: e.target.value })} className={FIELD}>
        <option value="">Choose</option>
        {options.map((s, i) => <option key={`${i}-${s}`} value={s}>{s}</option>)}
      </select>
    </div>
  );

  return (
    <li className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-semibold tabular-nums text-ink" aria-hidden>{n}</span>
        <label htmlFor={`p${row.id}-name`} className="sr-only">Full name, row {n}</label>
        <input id={`p${row.id}-name`} type="text" maxLength={100} value={row.name} placeholder="Full name" autoComplete="off"
          onChange={(e) => onChange({ name: e.target.value })} className={`${FIELD} px-4`} />
        {canRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove ${name || `row ${n}`}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-sunken hover:text-rose-700">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-3 sm:pl-11">
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label htmlFor={`p${row.id}-cut`} className="mobile-caption mb-1 block text-ink-muted">Cut (optional)</label>
            <select id={`p${row.id}-cut`} value={row.extra[CUT_COLUMN] ?? ''} onChange={(e) => onChange({ extra: { ...row.extra, [CUT_COLUMN]: e.target.value } })} className={FIELD}>
              <option value="">—</option>
              {CUTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {columns.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {columns.map((c) => (
              <div key={c} className="min-w-0">
                <label htmlFor={`p${row.id}-${c}`} className="mobile-caption mb-1 block truncate text-ink-muted">{c}</label>
                <input id={`p${row.id}-${c}`} type="text" maxLength={100} value={row.extra[c] ?? ''}
                  onChange={(e) => onChange({ extra: { ...row.extra, [c]: e.target.value } })} className={FIELD} />
              </div>
            ))}
          </div>
        )}
        {sized && gets}
        {sized && !gets && partChoosable && (
          <Segments label={`What ${name || `row ${n}`} gets`} value={area} onChange={(v) => onChange({ area: v, bottomSize: v === 'both' ? row.bottomSize : '' })} options={PARTS} />
        )}
        {sized && (
          <div className={`grid gap-3 ${area === 'both' ? 'grid-cols-2' : 'grid-cols-1 min-[481px]:grid-cols-2'}`}>
            {sizeSelect(`p${row.id}-size`, area === 'both' ? 'Top size' : 'Size', row.size, 'size')}
            {area === 'both' && sizeSelect(`p${row.id}-bottom`, 'Bottom size', row.bottomSize, 'bottomSize')}
          </div>
        )}
      </div>

      {sized && custom && (
        <div className="mt-4 border-t border-line pt-4 sm:pl-11">
          {unit
            ? <OrderPointInputs area={customArea(row, area)} unit={unit} values={row.fit} keyBy="label" idPrefix={`p${row.id}`}
                onChange={(k, v) => onChange({ fit: { ...row.fit, [k]: v } })} />
            : <p className="mobile-body-sm text-ink-muted">Choose inches or centimeters above to enter {name ? `${name}’s` : 'their'} measurements.</p>}
        </div>
      )}
    </li>
  );
}
