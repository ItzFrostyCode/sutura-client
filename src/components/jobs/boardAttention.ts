import { normalizeJobStatus, requiresDownpayment, needsMeasuring, type Job } from './jobHelpers';

/**
 * Due-date and "needs attention" rules for the Orders board: the attention
 * bar's counts/filters, each column's urgency groups and each card's due label
 * all read from here, so they always agree.
 */

const DONE = ['completed', 'cancelled', 'rejected'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Whole days from today to the due date (negative = past), or null with no due date. */
export function dueDays(job: Pick<Job, 'due_date'>): number | null {
  if (!job.due_date) return null;
  const due = new Date(job.due_date);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

/** Same "overdue" as the server (NotifyOverdueJobs): past due and not done or on hold. */
export function isOverdue(job: Job): boolean {
  const d = dueDays(job);
  return d !== null && d < 0 && ![...DONE, 'on_hold'].includes(job.status);
}

export type DueTone = 'red' | 'amber' | 'neutral' | 'faint';

/** The card's due label: "Overdue 2d", "Due today", "Due Fri", "Due Nov 28". */
export function dueLabel(job: Job): { label: string; tone: DueTone } | null {
  const d = dueDays(job);
  if (d === null || DONE.includes(job.status)) return null;
  if (job.status === 'on_hold') return { label: shortDate(d), tone: 'faint' };
  if (d < 0) return { label: `Overdue ${-d}d`, tone: 'red' };
  if (d === 0) return { label: 'Due today', tone: 'amber' };
  if (d === 1) return { label: 'Due tomorrow', tone: 'neutral' };
  if (d < 7) return { label: `Due ${DAYS[addDays(d).getDay()]}`, tone: 'neutral' };
  return { label: shortDate(d), tone: 'faint' };
}

function addDays(d: number): Date {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t;
}
function shortDate(d: number): string {
  const t = addDays(d);
  return `Due ${MONTHS[t.getMonth()]} ${t.getDate()}`;
}

export const DUE_TONE_CLASS: Record<DueTone, string> = {
  red: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-800',
  neutral: 'bg-sunken text-ink',
  faint: 'text-ink-muted',
};

/** Urgency groups inside a stage column. */
export const DUE_GROUPS: { key: string; label: string; tone: string; test: (d: number | null) => boolean }[] = [
  { key: 'overdue', label: 'Overdue', tone: 'text-rose-700', test: (d) => d !== null && d < 0 },
  { key: 'today', label: 'Due today', tone: 'text-amber-800', test: (d) => d === 0 },
  { key: 'week', label: 'This week', tone: 'text-ink-muted', test: (d) => d !== null && d > 0 && d < 7 },
  { key: 'later', label: 'Later', tone: 'text-ink-muted', test: (d) => d !== null && d >= 7 },
  { key: 'none', label: 'No due date', tone: 'text-ink-muted', test: (d) => d === null },
];

/** Most urgent first: earliest due date, rush first on the same day, then oldest order. */
export function byUrgency(a: Job, b: Job): number {
  const da = dueDays(a);
  const db = dueDays(b);
  if (da !== db) {
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  }
  if (Boolean(a.is_rush) !== Boolean(b.is_rush)) return a.is_rush ? -1 : 1;
  return a.id - b.id;
}

export function assignedStaffId(job: Job): number | null {
  return job.assigned_staff_id ?? job.assigned_to ?? (job.assigned_staff as { id?: number } | null | undefined)?.id ?? null;
}

/** In a stage that needs a downpayment, with nothing paid yet (the board's "No downpayment" tag). */
export function missingDownpayment(job: Job, repairRequiresDownpayment: boolean): boolean {
  return requiresDownpayment(job, normalizeJobStatus(job.status), repairRequiresDownpayment) && job.payment_status === 'unpaid';
}

export type AttentionKey = 'overdue' | 'today' | 'rush' | 'nodp' | 'measure' | 'unassigned';

export const ATTENTION_FILTERS: { key: AttentionKey; label: string; tone: 'red' | 'amber' | 'plain' }[] = [
  { key: 'overdue', label: 'Overdue', tone: 'red' },
  { key: 'today', label: 'Due today', tone: 'amber' },
  { key: 'rush', label: 'Rush', tone: 'red' },
  { key: 'nodp', label: 'No downpayment', tone: 'amber' },
  { key: 'measure', label: 'Needs measuring', tone: 'amber' },
  { key: 'unassigned', label: 'Unassigned', tone: 'plain' },
];

export function matchesAttention(job: Job, key: AttentionKey, repairRequiresDownpayment: boolean): boolean {
  if (DONE.includes(job.status)) return false;
  switch (key) {
    case 'overdue': return isOverdue(job);
    case 'today': return dueDays(job) === 0 && job.status !== 'on_hold';
    case 'rush': return Boolean(job.is_rush);
    case 'nodp': return missingDownpayment(job, repairRequiresDownpayment);
    case 'measure': return needsMeasuring(job);
    case 'unassigned': return job.status !== 'pending' && assignedStaffId(job) === null;
  }
}
