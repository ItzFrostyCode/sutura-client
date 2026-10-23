import type { Job } from './jobHelpers';

export interface StartBy {
  /** "Oct 23". */
  readonly label: string;
  /** Today is past the date: the order is already behind. */
  readonly late: boolean;
}

/** A "YYYY-MM-DD" (or full ISO) date as a local day, so the time zone never shifts it. */
function localDay(value: string): Date | null {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The latest day to start: the due date minus the service's usual days. Null when either is missing ("it depends" has no days). */
export function startBy(job: Pick<Job, 'due_date' | 'service'>): StartBy | null {
  const days = Number(job.service?.estimated_days);
  if (!job.due_date || !(days > 0)) return null;
  const date = localDay(job.due_date);
  if (!date) return null;
  date.setDate(date.getDate() - days);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { label: date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }), late: today > date };
}
