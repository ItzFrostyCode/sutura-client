'use client';

import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { ServiceOrderState } from './useServiceOrder';
import type { RosterRow } from './useOrderForm';
import type { Area, MeasuringPoint, Unit } from './orderPoints';
import OrderUnitCell from './OrderUnitCell';
import OrderGetsSelect from './OrderGetsSelect';
import { CUTS, CUT_COLUMN, type MeasureColumns } from './useMeasureColumns';

const FIELD = 'h-12 w-full min-w-0 rounded-xl border border-line bg-surface text-base text-ink focus:border-ink focus:outline-none';

function Points({ title, points, r, onChange, onUnit }: Readonly<{
  title: string; points: MeasuringPoint[]; r: RosterRow; onChange: (label: string, v: string) => void; onUnit: (label: string, u: Unit) => void;
}>) {
  if (points.length === 0) return null;
  return (
    <div className="border-l-2 border-line-strong pl-3">
      <p className="mobile-overline mb-2 text-ink">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {points.map((p) => (
          <div key={p.label} className="min-w-0">
            <span className="mobile-caption mb-1 block truncate text-ink-muted" aria-hidden>{p.label}</span>
            <OrderUnitCell wide label={`${r.name.trim() || 'This person'}, ${p.label}`} value={r.fit[p.label] ?? ''} unit={r.units[p.label] ?? 'in'}
              onValue={(v) => onChange(p.label, v)} onUnit={(u) => onUnit(p.label, u)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** One person on a phone: name, Cut and Gets always in view; their measurements fold open below. */
function PersonCard({ o, c, r, i }: Readonly<{ o: ServiceOrderState; c: MeasureColumns; r: RosterRow; i: number }>) {
  const { f } = o;
  const [open, setOpen] = useState(false);
  const gets = c.getsOf(r);
  const who = r.name.trim() || `Person ${i + 1}`;
  const typed = Object.values(r.fit).filter((v) => v.trim()).length;
  const set = (label: string, v: string) => f.updateRow(r.id, { fit: { ...r.fit, [label]: v } });
  const setUnit = (label: string, u: Unit) => f.updateRow(r.id, { units: { ...r.units, [label]: u } });

  return (
    <li className="rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <span className="w-6 shrink-0 text-center text-sm tabular-nums text-ink-faint" aria-hidden>{i + 1}</span>
        <input type="text" maxLength={100} value={r.name} placeholder="Full name" aria-label={`Full name, row ${i + 1}`}
          onChange={(e) => f.updateRow(r.id, { name: e.target.value })} className={`${FIELD} px-3`} />
        {f.roster.length > o.groupMin && (
          <button type="button" onClick={() => f.removeRow(r.id)} aria-label={`Remove ${who}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-sunken hover:text-rose-700"><Trash2 size={16} /></button>
        )}
      </div>
      <div className={`mt-2 grid gap-2 pl-8 ${o.areaLocked ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <select value={r.extra[CUT_COLUMN] ?? ''} aria-label={`${who}, cut`} onChange={(e) => f.updateRow(r.id, { extra: { ...r.extra, [CUT_COLUMN]: e.target.value } })} className={`${FIELD} px-2`}>
          <option value="">Cut (optional)</option>
          {CUTS.map((cut) => <option key={cut} value={cut}>{cut} cut</option>)}
        </select>
        <OrderGetsSelect o={o} row={r} className={`${FIELD} px-2`} prefix="Gets: " />
      </div>
      {o.rosterColumns.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2 pl-8">
          {o.rosterColumns.map((col) => (
            <input key={col} type="text" maxLength={100} value={r.extra[col] ?? ''} placeholder={col} aria-label={`${who}, ${col}`}
              onChange={(e) => f.updateRow(r.id, { extra: { ...r.extra, [col]: e.target.value } })} className={`${FIELD} px-3`} />
          ))}
        </div>
      )}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-sunken">
        <span>Measurements <span className="font-normal text-ink-muted">· {typed ? `${typed} typed` : 'none yet, the shop can measure'}</span></span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="mt-2 space-y-4 pl-1">
          {gets !== 'bottom' && <Points title="Top" points={c.top} r={r} onChange={set} onUnit={setUnit} />}
          {gets !== 'top' && <Points title="Bottom" points={c.bottom} r={r} onChange={set} onUnit={setUnit} />}
        </div>
      )}
    </li>
  );
}

/** Phone (under 600px): the group's measurements as one card per person instead of a wide table. */
export default function OrderMeasureCards({ o, c }: Readonly<{ o: ServiceOrderState; c: MeasureColumns }>) {
  return (
    <ol className="space-y-3">
      {o.f.roster.map((r, i) => <PersonCard key={r.id} o={o} c={c} r={r} i={i} />)}
    </ol>
  );
}
