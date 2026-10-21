import type { Appointment } from '../appointmentHelpers';

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-10-21 09:00:00" is not valid ISO for Safari; this reads both spellings. */
export const parseDT = (s: string) => new Date(s.includes('T') ? s : s.replace(' ', 'T'));

/** The calendar day (YYYY-MM-DD) an appointment is on. */
export const dayKeyOf = (a: Appointment) => (a.scheduled_at.includes('T') ? a.scheduled_at.split('T')[0] : a.scheduled_at.split(' ')[0]);
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Every appointment by its day, each day sorted by time: built once per list, so a month is 35 lookups, not 35 scans. */
export function groupByDay(list: Appointment[]): Map<string, Appointment[]> {
  const map = new Map<string, Appointment[]>();
  for (const a of list) {
    const key = dayKeyOf(a);
    const day = map.get(key);
    if (day) day.push(a); else map.set(key, [a]);
  }
  for (const day of map.values()) day.sort((x, y) => parseDT(x.scheduled_at).getTime() - parseDT(y.scheduled_at).getTime());
  return map;
}

export const hhmm = (a: Appointment) => {
  const d = parseDT(a.scheduled_at);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const clock = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
/** "9:00 AM – 9:30 AM". */
export const timeRange = (a: Appointment) => {
  const start = parseDT(a.scheduled_at);
  return `${clock(start)} – ${clock(new Date(start.getTime() + (a.duration_minutes ?? 30) * 60000))}`;
};

/** What the visit is about, in one line: the design, else the service, else the items, else the kind of visit. */
export const subjectLine = (a: Appointment) => {
  if (a.items && a.items.length > 1) return `${a.items.length} items (${a.items.reduce((n, it) => n + it.quantity, 0)} pcs)`;
  return a.catalog_item?.name || a.service?.name || a.purpose_label || (a.garment_category ? a.garment_category.replace(/_/g, ' ') : 'General visit');
};

/** The dot under a day: ochre while something waits or is on, sage when done, Steamed Latte when booked. */
const DOT: Record<string, string> = { pending: 'bg-amber-500', in_progress: 'bg-amber-500', confirmed: 'bg-taupe', completed: 'bg-sage' };
export const dotsFor = (events: Appointment[]) => Array.from(new Set(events.map((a) => DOT[a.status]).filter(Boolean))).slice(0, 3);

/** Whole weeks covering a month: the days of the neighbouring months fill the first and last row. */
export function monthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const total = Math.ceil((first.getDay() + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const date = new Date(year, month, 1 - first.getDay() + i);
    return { date, inMonth: date.getMonth() === month };
  });
}
