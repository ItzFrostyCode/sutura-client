import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CUSTOM_SIZE, type GarmentSpecColumn } from '@/components/jobs/jobTypes';
import { FIELD, LABEL } from './FormStep';
import type { SavedProfile } from './CustomFitPanel';
import RosterAddColumn from './RosterAddColumn';
import RosterCards from './RosterCards';
import RosterTable from './RosterTable';
import AreaSelector from '@/components/measurements/recorder/AreaSelector';
import { confirmDialog } from '@/store/useConfirmStore';
import { COVERS_FIELD } from '@/lib/orderUnits';
import { AREA_LABEL, areaOf, commonArea, fitFieldsFor, isBottomPoint, resetSizing, slug, type FitArea, type FitFields } from './rosterHelpers';
import type { RosterMember } from './types';
import { orderSize } from '@/lib/orderSize';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const ADD = 'inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md border border-espresso/25 bg-white px-4 text-sm font-medium text-espresso hover:bg-espresso/[0.06]';

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
  /** The customer's current measurement profiles, for a Custom Fit person who is already measured. */
  readonly profiles?: SavedProfile[];
  /** The shop's measuring unit, for a Custom Fit person's points. */
  readonly unit?: 'in' | 'cm';
  /** The option of the order covers something: everyone gets it and it cannot be changed here. */
  readonly areaLocked?: boolean;
}

/** Team / group order: one row per person (cards on a phone, a table from tablet width). Columns are added at the top right, people below. */
export default function RosterEditor({ teamName, onTeamName, roster, onRoster, newRow, minQty, columns, onColumns, chart, profiles, unit, areaLocked = false }: Props) {
  const [fitFields, setFitFields] = useState<FitFields>(() => fitFieldsFor(chart.columns));
  const sizes = [...(chart.rows.length > 0 ? chart.rows.map((r) => r.size) : DEFAULT_SIZES), CUSTOM_SIZE];
  const short = minQty && minQty > 1 && roster.length < minQty;
  const pieces = roster.reduce((sum, r) => sum + Math.max(1, Number.parseInt(r.qty ?? '1', 10) || 1), 0);

  // What a person covers decides what their size means: changing it (after one was chosen) clears the old sizes and measuring points.
  const withReset = (r: RosterMember, patch: Record<string, string>) => {
    const before = areaOf(r);
    return before && 'measure_area' in patch && patch.measure_area !== before ? { ...patch, ...resetSizing(r) } : patch;
  };
  const edit = (id: string, patch: Record<string, string>) => onRoster(roster.map((r) => (r.id === id ? { ...r, ...withReset(r, patch) } : r)));
  const teamArea = commonArea(roster);
  const applyArea = async (area: FitArea) => {
    const sized = roster.some((r) => areaOf(r) && areaOf(r) !== area && (r.size || r.bottom_size));
    if (sized && !(await confirmDialog({ title: `Everyone gets ${area === 'both' ? 'Top & Bottom' : area}?`, message: 'The sizes already chosen for people who covered something else are cleared, because a size means a different part now.', confirmLabel: 'Change for everyone' }))) return;
    onRoster(roster.map((r) => ({ ...r, ...withReset(r, { measure_area: area }), measure_area: area })));
  };
  const remove = (id: string) => onRoster(roster.filter((x) => x.id !== id));
  // New people start with what the list already agrees on (or what the last person has), so the choice is made once.
  const inherit = teamArea || (roster.length > 0 ? areaOf(roster[roster.length - 1]) : '');
  const addPeople = (n: number) => onRoster([...roster, ...Array.from({ length: n }, () => ({ ...newRow(), measure_area: inherit }))]);
  const rename = (id: string, label: string) => onColumns(columns.map((c) => (c.id === id ? { ...c, label } : c)));
  // "Pieces" is the garments for that one person (two polos for one wearer is one person, two pieces): it is the order's `qty`, a number.
  const addColumn = (label: string) => {
    const pieces = /^(pieces?|pcs|qty|quantity|garments?)$/i.test(label.trim());
    const key = pieces ? 'qty' : slug(label);
    if (key && !columns.some((c) => c.key === key)) onColumns([...columns, { id: `col_${Date.now()}`, key, label: pieces ? 'Pieces' : label, type: pieces ? 'number' : 'text' }]);
  };
  // The chart's numbers for that part only: a top shows chest and shoulder, a bottom shows waist and hips.
  const sizeNumbers = (size: string, part: 'top' | 'bottom') => {
    const hit = chart.rows.find((r) => r.size === size);
    return hit ? hit.values.map((v, i) => (v && isBottomPoint(chart.columns[i] ?? '') === (part === 'bottom') ? `${chart.columns[i]} ${v}` : '')).filter(Boolean).join(' · ') : '';
  };
  const shared = { roster, columns, sizes, sizeNumbers, onEdit: edit, onRemove: remove, fitFields, onFitFields: setFitFields, profiles, unit, areaLocked };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor="team-name" className={LABEL}>Team / group name</label>
          <input id="team-name" type="text" value={teamName} onChange={(e) => onTeamName(e.target.value)} placeholder="e.g. Grade 10 – Sampaguita" className={FIELD} />
        </div>
        <div className="md:hidden"><RosterAddColumn onAdd={addColumn} /></div>
      </div>
      {areaLocked
        ? <p className="text-sm text-espresso/70">{COVERS_FIELD} <strong>{teamArea ? AREA_LABEL[teamArea] : '…'}</strong>, set by the option you chose.</p>
        : <AreaSelector personName="everyone on the list" selectedArea={teamArea} onSelectArea={applyArea} />}
      <p className={`text-[13px] font-medium ${short ? 'text-espresso/70' : 'text-ink-muted'}`}>
        {orderSize(roster.length, minQty) ?? '0 people'}{pieces !== roster.length ? ` · ${pieces} pieces` : ''}{short ? ` · below the usual minimum of ${minQty}` : minQty && minQty > 1 ? ` · usual minimum ${minQty}` : ''}
      </p>

      <div className="md:hidden"><RosterCards {...shared} /></div>
      <RosterTable {...shared} onRename={rename} onColumns={onColumns} onAddColumn={addColumn} />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => addPeople(1)} className={`${ADD} w-full sm:w-auto`}><Plus size={15} />Add person</button>
        <button type="button" onClick={() => addPeople(5)} className={ADD}>+ 5 people</button>
      </div>
      {chart.rows.length === 0 && <p className="text-xs text-espresso/70">This service and design have no size chart with numbers yet, so a size such as M carries no measurements. Add a size chart on the service or design, or use Custom Fit.</p>}
      <p className="text-xs text-ink-muted">One row per person. For someone who needs a second set, add another row. Pick <strong>Custom Fit</strong> for a person who is not a standard size, then choose Top, Bottom or both and type the measurements right under their row. Use the <strong>+</strong> at the top right to add a column; on a wider screen, click a column title to rename it. A person who needs <strong>several garments of the same kind</strong> (two polos for one wearer) stays one row: add a <strong>Pieces</strong> column, so the people count stays right and the pieces add up.</p>
    </div>
  );
}
