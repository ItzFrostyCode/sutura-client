import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { GarmentSpecColumn } from '@/components/jobs/jobTypes';
import CustomFitPanel, { type SavedProfile } from './CustomFitPanel';
import RosterAddColumn from './RosterAddColumn';
import RosterCell from './RosterCell';
import { customParts, REQUIRED_KEYS, type FitFields } from './rosterHelpers';
import type { RosterMember } from './types';

const HEAD = 'h-9 w-full rounded-md border border-transparent bg-transparent px-1 text-[13px] font-medium text-ink-muted hover:border-espresso/[0.12] focus:border-espresso/25 focus:bg-white focus:outline-none';

interface Props {
  readonly roster: RosterMember[];
  readonly columns: GarmentSpecColumn[];
  readonly sizes: string[];
  readonly sizeNumbers: (size: string, part: 'top' | 'bottom') => string;
  readonly onEdit: (id: string, patch: Record<string, string>) => void;
  readonly onRemove: (id: string) => void;
  readonly onRename: (id: string, label: string) => void;
  readonly onColumns: (c: GarmentSpecColumn[]) => void;
  readonly onAddColumn: (label: string) => void;
  readonly fitFields: FitFields;
  readonly onFitFields: (next: FitFields) => void;
  readonly profiles?: SavedProfile[];
  readonly unit?: 'in' | 'cm';
  readonly areaLocked?: boolean;
}

/** The team list from tablet width up: a column per field (names can be renamed), a "+" at the top right to add a column, one row per person. */
export default function RosterTable({ roster, columns, sizes, sizeNumbers, onEdit, onRemove, onRename, onColumns, onAddColumn, fitFields, onFitFields, profiles, unit, areaLocked }: Props) {
  const [adding, setAdding] = useState(false);
  const template = `32px ${columns.map((c) => (c.key === 'player_name' ? 'minmax(150px,1.5fr)' : 'minmax(110px,1fr)')).join(' ')} 40px`;

  return (
    <div className={`hidden overflow-x-auto md:block ${adding ? 'pb-20' : 'pb-1'}`}>
      <div className="min-w-fit space-y-2" style={{ ['--cols' as string]: template }}>
        <div className="grid items-center gap-2 [grid-template-columns:var(--cols)]">
          <span className="text-[13px] text-ink-faint">#</span>
          {columns.map((c) => (
            <div key={c.id} className="group relative">
              <input aria-label={`Column name: ${c.label}`} value={c.label} onChange={(e) => onRename(c.id, e.target.value)} className={HEAD} />
              {REQUIRED_KEYS.includes(c.key) ? (
                <span aria-hidden title="Required" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-danger">*</span>
              ) : (
                <button type="button" aria-label={`Remove column ${c.label}`} onClick={() => onColumns(columns.filter((x) => x.id !== c.id))} className="absolute right-0 top-1.5 hidden h-6 w-6 cursor-pointer items-center justify-center rounded text-ink-faint hover:text-danger group-hover:flex"><X size={13} /></button>
              )}
            </div>
          ))}
          <div className="justify-self-end"><RosterAddColumn onAdd={onAddColumn} onOpenChange={setAdding} /></div>
        </div>

        {roster.map((r, i) => (
          <div key={r.id} className="grid items-start gap-2 [grid-template-columns:var(--cols)]">
            <span className="pt-2.5 text-[13px] font-medium text-ink-faint">{i + 1}</span>
            {columns.map((c) => <RosterCell key={c.id} column={c} row={r} number={i + 1} sizes={sizes} sizeNumbers={sizeNumbers} areaLocked={areaLocked} onEdit={(patch) => onEdit(r.id, patch)} />)}
            <button type="button" aria-label={`Remove row ${i + 1}`} disabled={roster.length === 1} onClick={() => onRemove(r.id)} className="flex h-10 w-10 cursor-pointer items-center justify-center justify-self-end rounded-md border border-espresso/25 bg-white text-espresso hover:bg-espresso/[0.06] disabled:cursor-default disabled:opacity-30"><Trash2 size={16} /></button>
            {customParts(r).length > 0 && <CustomFitPanel unit={unit} row={r} profiles={profiles} who={r.player_name || `person ${i + 1}`} fields={fitFields} onFields={onFitFields} onChange={(patch) => onEdit(r.id, patch)} />}
          </div>
        ))}
      </div>
    </div>
  );
}
