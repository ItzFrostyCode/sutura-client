import type { GarmentSpecColumn } from '@/components/jobs/jobTypes';
import { CUSTOM_SIZE } from '@/components/jobs/jobTypes';
import type { RosterMember, ServiceField } from './types';

/** Same keys the job's own Spec Table uses, so the table keeps its columns when the order is opened. */
export const BASE_COLUMNS: GarmentSpecColumn[] = [
  { id: 'col_player_name', key: 'player_name', label: 'Name', type: 'text' },
  { id: 'col_print_name', key: 'print_name', label: 'Printed name', type: 'text' },
  { id: 'col_number', key: 'number', label: 'Number', type: 'text' },
  { id: 'col_size', key: 'size', label: 'Size', type: 'text' },
  { id: 'col_qty', key: 'qty', label: 'Pieces', type: 'number' },
];

/** Columns that cannot be removed: a row needs someone to be for and a size to cut. */
export const REQUIRED_KEYS = ['player_name', 'size'];

export const FIT_PREFIX = 'fit_';
const DEFAULT_FIT_FIELDS = ['Chest', 'Shoulder', 'Sleeve', 'Waist', 'Length'];

export const slug = (label: string) => label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/** The base columns plus whatever the service asks of each person (Services → Booking Form). */
export function defaultColumns(extra?: ServiceField[] | null): GarmentSpecColumn[] {
  const have = new Set(BASE_COLUMNS.map((c) => c.key).concat(['jersey_number', 'no', 'printed_name', 'name']));
  const more = (extra ?? []).filter((f) => f.label.trim() && !have.has(slug(f.label)))
    .map((f) => (f.type === 'select' && (f.options?.length ?? 0) > 0
      ? { id: f.id, key: slug(f.label), label: f.label.trim(), type: 'select' as const, options: f.options }
      : { id: f.id, key: slug(f.label), label: f.label.trim(), type: 'text' as const }));
  return [...BASE_COLUMNS, ...more];
}

/** The measuring points offered for a Custom Fit: the size chart's own columns when the shop has one. */
export const fitFieldsFor = (chartColumns?: string[] | null): string[] => (chartColumns && chartColumns.length > 0 ? chartColumns : DEFAULT_FIT_FIELDS);

/** Turns each Custom Fit row's typed measurements into one "Chest 40 · Waist 32" column, and drops the working fields. */
export function compileRoster(rows: RosterMember[], columns: GarmentSpecColumn[]): { rows: RosterMember[]; columns: GarmentSpecColumn[] } {
  let anyFit = false;
  const out = rows.map((row) => {
    const next: RosterMember = { id: row.id };
    const fit: string[] = [];
    for (const [k, v] of Object.entries(row)) {
      if (k.startsWith(FIT_PREFIX)) {
        if (row.size === CUSTOM_SIZE && String(v).trim()) fit.push(`${k.slice(FIT_PREFIX.length)} ${String(v).trim()}`);
      } else next[k] = v;
    }
    if (fit.length > 0) { next.fit = fit.join(' · '); anyFit = true; }
    return next as RosterMember;
  });
  const withFit = anyFit && !columns.some((c) => c.key === 'fit') ? [...columns, { id: 'col_fit', key: 'fit', label: 'Custom fit measurements', type: 'text' as const }] : columns;
  return { rows: out, columns: withFit };
}

/** The older roster shape the job card, tracker and print ticket read (name instead of player_name). */
export function toTeamRoster(rows: RosterMember[]) {
  return rows.map(({ id: _id, player_name, ...rest }) => ({ name: player_name ?? '', ...rest }));
}
