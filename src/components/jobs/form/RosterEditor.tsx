import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { CUSTOM_SIZE, type GarmentSpecColumn } from '@/components/jobs/jobTypes';
import { FIELD, LABEL } from './FormStep';
import CustomFitPanel from './CustomFitPanel';
import { fitFieldsFor, REQUIRED_KEYS, slug } from './rosterHelpers';
import type { RosterMember } from './types';
import { orderSize } from '@/lib/orderSize';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const CELL = 'h-10 w-full rounded-lg border border-espresso/25 bg-white px-2 text-base sm:text-sm text-ink focus:outline-none focus:border-espresso/25 focus:ring-2 focus:ring-espresso/25';
const HEAD = 'h-9 w-full rounded-md border border-transparent bg-transparent px-1 text-[13px] font-medium text-ink-muted hover:border-espresso/[0.12] focus:border-espresso/25 focus:bg-white focus:outline-none';

interface Props {
  readonly teamName: string;
  readonly onTeamName: (v: string) => void;
  readonly roster: RosterMember[];
  readonly onRoster: (r: RosterMember[]) => void;
  readonly newRow: () => RosterMember;
  readonly minQty?: number;
  readonly columns: GarmentSpecColumn[];
  readonly onColumns: (c: GarmentSpecColumn[]) => void;
  /** The service's (or design's) size chart: its sizes fill the Size list and its numbers say what each size means. */
  readonly chart: { columns: string[]; rows: { size: string; values: string[] }[] };
}

/** Team / group order: one row per person. The owner names the columns, adds or removes them, and a Custom Fit row opens its own measuring panel. */
export default function RosterEditor({ teamName, onTeamName, roster, onRoster, newRow, minQty, columns, onColumns, chart }: Props) {
  const [fitFields, setFitFields] = useState<string[]>(() => fitFieldsFor(chart.columns));
  const [adding, setAdding] = useState('');
  const sizes = [...(chart.rows.length > 0 ? chart.rows.map((r) => r.size) : DEFAULT_SIZES), CUSTOM_SIZE];
  const template = `32px ${columns.map((c) => (c.key === 'player_name' ? 'minmax(170px,1.6fr)' : 'minmax(120px,1fr)')).join(' ')} 40px`;
  const short = minQty && minQty > 1 && roster.length < minQty;
  const pieces = roster.reduce((sum, r) => sum + Math.max(1, Number.parseInt(r.qty ?? '1', 10) || 1), 0);

  const edit = (id: string, patch: Record<string, string>) => onRoster(roster.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const rename = (id: string, label: string) => onColumns(columns.map((c) => (c.id === id ? { ...c, label } : c)));
  const addColumn = () => {
    const label = adding.trim();
    const key = slug(label);
    if (label && key && !columns.some((c) => c.key === key)) onColumns([...columns, { id: `col_${Date.now()}`, key, label, type: 'text' }]);
    setAdding('');
  };
  const sizeNumbers = (size: string) => {
    const hit = chart.rows.find((r) => r.size === size);
    return hit ? hit.values.map((v, i) => (v ? `${chart.columns[i]} ${v}` : '')).filter(Boolean).join(' · ') : '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor="team-name" className={LABEL}>Team / group name</label>
          <input id="team-name" type="text" value={teamName} onChange={(e) => onTeamName(e.target.value)} placeholder="e.g. Grade 10 – Sampaguita" className={FIELD} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`mr-2 text-[13px] font-medium ${short ? 'text-espresso/70' : 'text-ink-muted'}`}>{orderSize(roster.length, minQty) ?? '0 people'}{pieces !== roster.length ? ` · ${pieces} pieces` : ''}{short ? ` · below the usual minimum of ${minQty}` : minQty && minQty > 1 ? ` · usual minimum ${minQty}` : ''}</span>
          {[1, 5, 10].map((n) => (
            <button key={n} type="button" onClick={() => onRoster([...roster, ...Array.from({ length: n }, newRow)])} className="h-10 cursor-pointer rounded-lg border border-espresso/25 bg-white px-3 text-[13px] font-medium text-ink hover:bg-espresso/[0.03]">+ {n}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[640px] space-y-2" style={{ ['--cols' as string]: template }}>
          <div className="grid items-center gap-2 [grid-template-columns:var(--cols)]">
            <span className="text-[13px] text-ink-faint">#</span>
            {columns.map((c) => (
              <div key={c.id} className="group relative">
                <input aria-label={`Column name: ${c.label}`} value={c.label} onChange={(e) => rename(c.id, e.target.value)} className={HEAD} />
                {REQUIRED_KEYS.includes(c.key) && <span aria-hidden title="Required" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-danger">*</span>}
                {!REQUIRED_KEYS.includes(c.key) && (
                  <button type="button" aria-label={`Remove column ${c.label}`} onClick={() => onColumns(columns.filter((x) => x.id !== c.id))} className="absolute right-0 top-1.5 hidden h-6 w-6 cursor-pointer items-center justify-center rounded text-ink-faint hover:text-danger group-hover:flex"><X size={13} /></button>
                )}
              </div>
            ))}
            <span />
          </div>

          {roster.map((r, i) => (
            <div key={r.id} className="grid items-start gap-2 [grid-template-columns:var(--cols)]">
              <span className="pt-2.5 text-[13px] font-medium text-ink-faint">{i + 1}</span>
              {columns.map((c) => c.key === 'size' ? (
                <div key={c.id}>
                  <select aria-label={`Size ${i + 1}`} required value={r.size ?? ''} onChange={(e) => edit(r.id, { size: e.target.value })} className={CELL}>
                    <option value="">Size</option>
                    {sizes.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {r.size && r.size !== CUSTOM_SIZE && sizeNumbers(r.size) && <p className="mt-1 text-[11px] text-ink-muted">{sizeNumbers(r.size)}</p>}
                </div>
              ) : c.type === 'select' && (c.options?.length ?? 0) > 0 ? (
                <select key={c.id} aria-label={`${c.label} ${i + 1}`} value={r[c.key] ?? ''} onChange={(e) => edit(r.id, { [c.key]: e.target.value })} className={CELL}>
                  <option value="">{c.label}</option>
                  {c.options!.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input key={c.id} aria-label={`${c.label} ${i + 1}`} {...(c.key === 'qty' || c.type === 'number' ? { type: 'number', min: 1, inputMode: 'numeric' as const } : {})} required={c.key === 'player_name'} value={r[c.key] ?? ''} onChange={(e) => edit(r.id, { [c.key]: e.target.value })} placeholder={c.label} className={CELL} />
              ))}
              <button type="button" aria-label={`Remove row ${i + 1}`} disabled={roster.length === 1} onClick={() => onRoster(roster.filter((x) => x.id !== r.id))} className="flex h-10 w-10 cursor-pointer items-center justify-center justify-self-end rounded-md border border-espresso/25 bg-white text-espresso hover:bg-espresso/[0.06] disabled:cursor-default disabled:opacity-30"><Trash2 size={16} /></button>
              {r.size === CUSTOM_SIZE && <CustomFitPanel row={r} who={r.player_name || `person ${i + 1}`} fields={fitFields} onFields={setFitFields} onChange={(patch) => edit(r.id, patch)} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input aria-label="New column name" value={adding} onChange={(e) => setAdding(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColumn(); } }} placeholder="Add a column, e.g. Position" className={`${FIELD} max-w-64`} />
        <button type="button" onClick={addColumn} className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md border border-espresso/25 bg-white px-4 text-sm font-medium text-espresso hover:bg-espresso/[0.06]"><Plus size={15} />Add column</button>
      </div>
      {chart.rows.length === 0 && <p className="text-xs text-espresso/70">This service and design have no size chart with numbers yet, so a size such as M carries no measurements. Add a size chart on the service or design, or use Custom Fit.</p>}
      <p className="text-xs text-ink-muted">Click a column title to rename it. Pick <strong>Custom Fit</strong> for someone who is not a standard size and type their measurements right under their row.</p>
    </div>
  );
}
