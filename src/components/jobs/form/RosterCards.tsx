import { Trash2 } from 'lucide-react';
import type { GarmentSpecColumn } from '@/components/jobs/jobTypes';
import RosterCell from './RosterCell';
import CustomFitPanel, { type SavedProfile } from './CustomFitPanel';
import { customParts, type FitFields } from './rosterHelpers';
import type { RosterMember } from './types';

interface Props {
  readonly roster: RosterMember[];
  readonly columns: GarmentSpecColumn[];
  readonly sizes: string[];
  readonly sizeNumbers: (size: string, part: 'top' | 'bottom') => string;
  readonly onEdit: (id: string, patch: Record<string, string>) => void;
  readonly onRemove: (id: string) => void;
  readonly fitFields: FitFields;
  readonly onFitFields: (next: FitFields) => void;
  readonly profiles?: SavedProfile[];
  readonly unit?: 'in' | 'cm';
  readonly areaLocked?: boolean;
}

/** The team list on a phone: one card per person, every field stacked with its own label, so nothing scrolls sideways. */
export default function RosterCards({ roster, columns, sizes, sizeNumbers, onEdit, onRemove, fitFields, onFitFields, profiles, unit, areaLocked }: Props) {
  return (
    <ul className="space-y-3">
      {roster.map((r, i) => (
        <li key={r.id} className="space-y-3 rounded-xl border border-espresso/15 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[15px] font-semibold text-ink">{i + 1}. {r.player_name || `Person ${i + 1}`}</p>
            <button type="button" aria-label={`Remove person ${i + 1}`} disabled={roster.length === 1} onClick={() => onRemove(r.id)} className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-espresso/25 bg-white text-espresso hover:bg-espresso/[0.06] disabled:cursor-default disabled:opacity-30"><Trash2 size={16} /></button>
          </div>
          {columns.map((c) => (
            <div key={c.id}>
              <label htmlFor={`rc-${r.id}-${c.key}`} className="mb-1 block text-sm font-medium text-espresso">{c.label}</label>
              <RosterCell id={`rc-${r.id}-${c.key}`} column={c} row={r} number={i + 1} sizes={sizes} sizeNumbers={sizeNumbers} areaLocked={areaLocked} onEdit={(patch) => onEdit(r.id, patch)} />
            </div>
          ))}
          {customParts(r).length > 0 && <CustomFitPanel unit={unit} row={r} profiles={profiles} who={r.player_name || `person ${i + 1}`} fields={fitFields} onFields={onFitFields} onChange={(patch) => onEdit(r.id, patch)} />}
        </li>
      ))}
    </ul>
  );
}
