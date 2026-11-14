'use client';

import { Trash2, X } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import type { RosterRow } from './useOrderForm';
import OrderInfoTip from './OrderInfoTip';
import OrderAddColumn from './OrderAddColumn';
import OrderGetsSelect from './OrderGetsSelect';
import OrderUnitCell from './OrderUnitCell';
import type { Area, MeasuringPoint } from './orderPoints';
import { CUTS, CUT_COLUMN, CUT_TIP, type MeasureColumns } from './useMeasureColumns';

const FIELD = 'h-11 rounded-lg border border-line bg-surface text-base text-ink focus:border-ink focus:outline-none';
// Top and Bottom share the page's background; a strong rule starts each group so they never blur together.
const GROUP_EDGE = 'border-l-2 border-line-strong';
const GETS: { value: Area; label: string }[] = [{ value: 'both', label: 'Set' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }];

/**
 * Tablet and desktop (600px+): the group's measurements as one table — a row per person (name kept in view while the
 * row scrolls), Cut, the shop's own columns, Gets, then the Top columns and the Bottom columns, each group opened by a
 * rule. Each column has (i) and ×, and every cell its own in | cm; "+ Add" ends each group. A blank cell is fine.
 */
export default function OrderMeasureTable({ o, c }: Readonly<{ o: ServiceOrderState; c: MeasureColumns }>) {
  const { f } = o;
  const head = (p: MeasuringPoint, first: boolean) => (
    <th key={p.label} scope="col" className={`px-1 pb-2 align-bottom font-semibold ${first ? GROUP_EDGE : ''}`}>
      <span className="flex items-center justify-center gap-0.5 whitespace-nowrap">
        {p.label}
        <OrderInfoTip label={p.label} text={p.tip} />
        <button type="button" onClick={() => c.removeCol(p.label)} aria-label={`Remove the ${p.label} column`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:bg-sunken hover:text-rose-700"><X size={14} /></button>
      </span>
    </th>
  );
  const cell = (r: RosterRow, p: MeasuringPoint, off: boolean, first: boolean) => (
    <td key={p.label} className={`px-1 py-1.5 ${first ? GROUP_EDGE : ''}`}>
      <OrderUnitCell label={`${r.name.trim() || 'This person'}, ${p.label}`} disabled={off}
        value={r.fit[p.label] ?? ''} unit={r.units[p.label] ?? 'in'}
        onValue={(v) => f.updateRow(r.id, { fit: { ...r.fit, [p.label]: v } })}
        onUnit={(u) => f.updateRow(r.id, { units: { ...r.units, [p.label]: u } })} />
    </td>
  );
  const groupHead = (label: string, span: number) => (
    <th colSpan={span} className={`${GROUP_EDGE} border-b border-line px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink`}>{label}</th>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="min-w-max text-sm">
        <thead className="text-ink-muted">
          <tr>
            <th scope="col" rowSpan={2} className="sticky left-0 z-20 bg-surface px-3 pb-2 text-left align-bottom font-semibold">Name</th>
            <th scope="col" rowSpan={2} className="px-1 pb-2 align-bottom font-semibold">
              <span className="flex items-center justify-center gap-0.5">{CUT_COLUMN}<OrderInfoTip label={CUT_COLUMN} text={CUT_TIP} /></span>
            </th>
            {o.rosterColumns.map((col) => <th key={col} scope="col" rowSpan={2} className="whitespace-nowrap px-2 pb-2 align-bottom font-semibold">{col}</th>)}
            {!o.areaLocked && <th scope="col" rowSpan={2} className="px-2 pb-2 align-bottom font-semibold">Gets</th>}
            {c.showTop && groupHead('Top', c.top.length + 1)}
            {c.showBottom && groupHead('Bottom', c.bottom.length + 1)}
          </tr>
          <tr>
            {c.top.map((p, i) => head(p, i === 0))}
            {c.showTop && <th scope="col" className={`px-2 pb-2 align-bottom ${c.top.length === 0 ? GROUP_EDGE : ''}`}><OrderAddColumn part="top" taken={c.taken} onAdd={(l) => f.addCustomCol('top', l)} /></th>}
            {c.bottom.map((p, i) => head(p, i === 0))}
            {c.showBottom && <th scope="col" className={`px-2 pb-2 align-bottom ${c.bottom.length === 0 ? GROUP_EDGE : ''}`}><OrderAddColumn part="bottom" taken={c.taken} onAdd={(l) => f.addCustomCol('bottom', l)} /></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {f.roster.map((r, i) => {
            const gets = c.getsOf(r);
            const who = r.name.trim() || `row ${i + 1}`;
            return (
              <tr key={r.id}>
                <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-1.5 text-left font-normal">
                  <span className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-ink-faint">{i + 1}</span>
                    <input type="text" maxLength={100} value={r.name} placeholder="Full name" aria-label={`Full name, row ${i + 1}`}
                      onChange={(e) => f.updateRow(r.id, { name: e.target.value })} className={`${FIELD} w-40 px-3`} />
                    {f.roster.length > o.groupMin && (
                      <button type="button" onClick={() => f.removeRow(r.id)} aria-label={`Remove ${who}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-sunken hover:text-rose-700"><Trash2 size={15} /></button>
                    )}
                  </span>
                </th>
                <td className="px-1 py-1.5">
                  <select value={r.extra[CUT_COLUMN] ?? ''} aria-label={`${who}, cut`} onChange={(e) => f.updateRow(r.id, { extra: { ...r.extra, [CUT_COLUMN]: e.target.value } })}
                    className={`${FIELD} w-24 px-1`}>
                    <option value="">—</option>
                    {CUTS.map((cut) => <option key={cut} value={cut}>{cut}</option>)}
                  </select>
                </td>
                {o.rosterColumns.map((col) => (
                  <td key={col} className="px-2 py-1.5">
                    <input type="text" maxLength={100} value={r.extra[col] ?? ''} aria-label={`${who}, ${col}`}
                      onChange={(e) => f.updateRow(r.id, { extra: { ...r.extra, [col]: e.target.value } })} className={`${FIELD} w-24 px-2 text-center`} />
                  </td>
                ))}
                {!o.areaLocked && (
                  <td className="px-2 py-1.5">
                    <OrderGetsSelect o={o} row={r} className={`${FIELD} px-2`} />
                  </td>
                )}
                {c.top.map((p, k) => cell(r, p, gets === 'bottom', k === 0))}
                {c.showTop && <td aria-hidden className={c.top.length === 0 ? GROUP_EDGE : ''} />}
                {c.bottom.map((p, k) => cell(r, p, gets === 'top', k === 0))}
                {c.showBottom && <td aria-hidden className={c.bottom.length === 0 ? GROUP_EDGE : ''} />}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
