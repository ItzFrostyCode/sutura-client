import type { GarmentSpecColumn } from '@/components/jobs/jobTypes';
import { CUSTOM_SIZE } from '@/components/jobs/jobTypes';
import type { RosterMember, ServiceField } from './types';
import { COVERS_LABEL } from '@/lib/orderUnits';

/**
 * The team list's default columns, one person per row. The keys are the ones the job's Spec Table, tracker and work ticket
 * already read (print_name = the nickname on the garment, number = jersey number, position = role). Name, Covers (what the person gets: top,
 * bottom or both) and Size are required; Covers is picked first and decides which sizes and measuring points the person has.
 * There is no Pieces column: a person who needs a second set is a second row.
 */
export const BASE_COLUMNS: GarmentSpecColumn[] = [
  { id: 'col_player_name', key: 'player_name', label: 'Person Name', type: 'text' },
  { id: 'col_print_name', key: 'print_name', label: 'Nickname', type: 'text' },
  { id: 'col_number', key: 'number', label: 'Jersey Number', type: 'text' },
  { id: 'col_position', key: 'position', label: 'Role / Position', type: 'text' },
  { id: 'col_covers', key: 'measure_area', label: 'Covers', type: 'text' },
  { id: 'col_size', key: 'size', label: 'Size', type: 'text' },
];

/** Columns that cannot be removed: a row needs someone to be for and a size to cut. */
export const REQUIRED_KEYS = ['player_name', 'measure_area', 'size'];
/** Columns the owner may leave empty; their field says so. */
export const OPTIONAL_KEYS = ['print_name', 'number', 'position'];

export const FIT_PREFIX = 'fit_';

/** What a Custom Fit person is measured for: the top, the bottom, or both (a set). */
export type FitArea = 'top' | 'bottom' | 'both';
/** What a person gets / is measured for. '' = not chosen yet. */
export const AREA_LABEL: Record<FitArea, string> = COVERS_LABEL;
export const isFitArea = (v: unknown): v is FitArea => v === 'top' || v === 'bottom' || v === 'both';
export const areaOf = (row: RosterMember): FitArea | '' => (isFitArea(row.measure_area) ? row.measure_area : '');

/** Words that mark a size-chart column or measuring point as belonging to the bottom (trousers, skirt); everything else is the top. */
const BOTTOM_WORDS = ['waist', 'hip', 'inseam', 'outseam', 'thigh', 'knee', 'crotch', 'rise', 'leg opening', 'ankle', 'bottom', 'pants', 'skirt'];
export const isBottomPoint = (name: string) => BOTTOM_WORDS.some((w) => name.toLowerCase().includes(w));

/**
 * Which parts of a person are Custom Fit (measured instead of a chart size). The size lives in `size` for a top or a bottom
 * on its own; for top & bottom the top is `size` and the bottom is `bottom_size`.
 */
export function customParts(row: RosterMember): ('top' | 'bottom')[] {
  const area = areaOf(row);
  const out: ('top' | 'bottom')[] = [];
  if (area !== 'bottom' && row.size === CUSTOM_SIZE) out.push('top');
  if ((area === 'bottom' && row.size === CUSTOM_SIZE) || (area === 'both' && row.bottom_size === CUSTOM_SIZE)) out.push('bottom');
  return out;
}

/** "M", "L" or "M / L": the size(s) of a person as one line. */
export const sizeSummary = (row: RosterMember): string => (areaOf(row) === 'both' ? [row.size, row.bottom_size].filter(Boolean).join(' / ') : row.size ?? '');

/** Every part a person covers has a size (a chart size or Custom Fit). */
export const hasAllSizes = (row: RosterMember): boolean => Boolean(String(row.size ?? '').trim()) && (areaOf(row) !== 'both' || Boolean(String(row.bottom_size ?? '').trim()));

/** The size and measuring points of a person, emptied: used when what they cover changes, since the old sizes no longer mean the same part. */
export function resetSizing(row: RosterMember): Record<string, string> {
  const out: Record<string, string> = { size: '', bottom_size: '', measurement_id: '' };
  for (const k of Object.keys(row)) if (k.startsWith(FIT_PREFIX)) out[k] = '';
  return out;
}

/** The people on a list all cover the same thing: that thing, else ''. */
export function commonArea(rows: RosterMember[]): FitArea | '' {
  const first = rows[0] ? areaOf(rows[0]) : '';
  return first && rows.every((r) => areaOf(r) === first) ? first : '';
}

/** The measuring points shared by every Custom Fit row, per part (same names the measurement forms use). */
export interface FitFields { top: string[]; bottom: string[] }
const TOP_POINTS = ['Chest', 'Shoulder', 'Sleeve', 'Neck', 'Shirt Length'];
const BOTTOM_POINTS = ['Waist', 'Hips', 'Inseam', 'Outseam', 'Thigh'];

export const slug = (label: string) => label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/** The base columns plus whatever the service asks of each person (Services → Booking Form). A service field with the same name as a base column (e.g. a Position list) replaces it. */
export function defaultColumns(extra?: ServiceField[] | null): GarmentSpecColumn[] {
  const named = (extra ?? []).filter((f) => f.label.trim());
  const asColumn = (f: ServiceField): GarmentSpecColumn => (f.type === 'select' && (f.options?.length ?? 0) > 0
    ? { id: f.id, key: slug(f.label), label: f.label.trim(), type: 'select', options: f.options }
    : { id: f.id, key: slug(f.label), label: f.label.trim(), type: 'text' });
  const alias: Record<string, string> = { role: 'position', jersey_number: 'number', no: 'number', printed_name: 'print_name', nickname: 'print_name', name: 'player_name' };
  const key = (f: ServiceField) => alias[slug(f.label)] ?? slug(f.label);
  const base = BASE_COLUMNS.map((c) => {
    const over = named.find((f) => key(f) === c.key && c.key !== 'size' && f.type === 'select');
    return over ? { ...asColumn(over), key: c.key } : c;
  });
  const have = new Set(BASE_COLUMNS.map((c) => c.key));
  return [...base, ...named.filter((f) => !have.has(key(f))).map(asColumn)];
}

/** The measuring points offered for a Custom Fit: the size chart's own columns (top) when the shop has one, else the usual ones. */
export function fitFieldsFor(chartColumns?: string[] | null): FitFields {
  const top = chartColumns && chartColumns.length > 0 ? chartColumns : TOP_POINTS;
  const taken = new Set(top.map((t) => t.toLowerCase()));
  return { top, bottom: BOTTOM_POINTS.filter((p) => !taken.has(p.toLowerCase())) };
}

/** The points shown for an area, in order. */
export const pointsFor = (fields: FitFields, area: FitArea): string[] => (area === 'top' ? fields.top : area === 'bottom' ? fields.bottom : [...fields.top, ...fields.bottom]);

/** Turns each Custom Fit row's typed measurements into one "Chest 40 · Waist 32" column, and drops the working fields. */
export function compileRoster(rows: RosterMember[], columns: GarmentSpecColumn[]): { rows: RosterMember[]; columns: GarmentSpecColumn[] } {
  let anyFit = false;
  const out = rows.map((row) => {
    const next: RosterMember = { id: row.id };
    const fit: string[] = [];
    for (const [k, v] of Object.entries(row)) {
      if (k.startsWith(FIT_PREFIX)) {
        if (customParts(row).length > 0 && String(v).trim()) fit.push(`${k.slice(FIT_PREFIX.length)} ${String(v).trim()}`);
      } else next[k] = v;
    }
    if (fit.length > 0) { next.fit = fit.join(' · '); anyFit = true; }
    return next as RosterMember;
  });
  const withFit = anyFit && !columns.some((c) => c.key === 'fit') ? [...columns, { id: 'col_fit', key: 'fit', label: 'Custom fit measurements', type: 'text' as const }] : columns;
  // A top & bottom person has two sizes: the second one gets its own column so it can be read and edited on the order too.
  const hasBottom = out.some((r) => r.bottom_size) && !withFit.some((c) => c.key === 'bottom_size');
  const withBottom = hasBottom ? [...withFit, { id: 'col_bottom_size', key: 'bottom_size', label: 'Bottom size', type: 'text' as const }] : withFit;
  return { rows: out, columns: withBottom };
}

/** The older roster shape the job card, tracker and print ticket read (name instead of player_name). */
export function toTeamRoster(rows: RosterMember[]) {
  return rows.map(({ id: _id, player_name, ...rest }) => ({ name: player_name ?? '', ...rest }));
}
