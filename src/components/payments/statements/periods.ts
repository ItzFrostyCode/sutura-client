// Period presets for the Statements screen. All dates are local calendar days ("YYYY-MM-DD").

export type PeriodId =
  | 'this_week' | 'last_week' | 'last_14' | 'half_current' | 'half_last'
  | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'all_time' | 'custom';

export const PERIODS: { id: PeriodId; label: string; group: string }[] = [
  { id: 'this_week', label: 'This week', group: 'Weekly' },
  { id: 'last_week', label: 'Last week', group: 'Weekly' },
  { id: 'last_14', label: 'Last 2 weeks', group: 'Bi-weekly' },
  { id: 'half_current', label: 'This half-month', group: 'Bi-weekly' },
  { id: 'half_last', label: 'Last half-month', group: 'Bi-weekly' },
  { id: 'this_month', label: 'This month', group: 'Monthly' },
  { id: 'last_month', label: 'Last month', group: 'Monthly' },
  { id: 'this_year', label: 'This year', group: 'Yearly' },
  { id: 'last_year', label: 'Last year', group: 'Yearly' },
  { id: 'all_time', label: 'All time', group: 'Everything' },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

/** Monday of the week containing `d`. */
const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

/** [from, to] for a preset. `firstRecord` (YYYY-MM-DD) is where "All time" begins — the first payment ever recorded. */
export function rangeFor(id: PeriodId, firstRecord: string | null, now = new Date()): [string, string] {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (id) {
    case 'this_week': return [iso(weekStart(now)), iso(now)];
    case 'last_week': { const s = addDays(weekStart(now), -7); return [iso(s), iso(addDays(s, 6))]; }
    case 'last_14': return [iso(addDays(now, -13)), iso(now)];
    case 'half_current': return now.getDate() <= 15 ? [iso(new Date(y, m, 1)), iso(new Date(y, m, 15))] : [iso(new Date(y, m, 16)), iso(new Date(y, m + 1, 0))];
    case 'half_last': return now.getDate() <= 15 ? [iso(new Date(y, m - 1, 16)), iso(new Date(y, m, 0))] : [iso(new Date(y, m, 1)), iso(new Date(y, m, 15))];
    case 'this_month': return [iso(new Date(y, m, 1)), iso(now)];
    case 'last_month': return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
    case 'this_year': return [iso(new Date(y, 0, 1)), iso(now)];
    case 'last_year': return [iso(new Date(y - 1, 0, 1)), iso(new Date(y - 1, 11, 31))];
    case 'all_time': return [firstRecord ?? iso(new Date(y, 0, 1)), iso(now)];
    default: return [iso(new Date(y, m, 1)), iso(now)];
  }
}

export const prettyDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
