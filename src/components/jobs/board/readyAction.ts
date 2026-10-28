import { jobGarments } from '@/lib/orderSize';
import { shopStageOf } from '../jobStage';
import type { Job } from '../jobHelpers';

const num = (v: unknown) => Number.parseFloat(String(v ?? '0')) || 0;

/** True for a card in the Ready column that goes through the ordering flow. */
export const isReadyCard = (job: Job) => shopStageOf(job) === 'ready' && Boolean(job.uses_confirmation_flow);

/** How many physical garments there are to hand over: the ordered quantity (each person's own pieces on a group order) × the garments in one unit (2 for a set). Same as JobOrder::garmentCount(). */
export function handoverTotal(job: Job): number {
  return jobGarments(job);
}

export type ReadyAction =
  | { kind: 'move'; status: string; label: string; message: string }
  | { kind: 'link'; href: string; label: string }
  | null;

/** The Ready card's one next button: Start fitting, else Collect (owner / manager), else Hand over, else Complete. Mirrors the Steps tab. */
export function readyAction(job: Job, canSeeMoney: boolean): ReadyAction {
  const balance = num(job.balance);
  // Staff are not sent the amounts, only whether something is still owed.
  const owing = job.has_balance ?? balance > 0.005;
  const released = Boolean(job.released_with_balance_at);
  const open = `/dashboard/jobs/${job.id}`;
  const fitting = job.fitting_requirement != null && job.fitting_requirement !== 'none';
  const all = num(job.handed_over_count) >= handoverTotal(job);

  if (fitting && !job.fitting_passed_at && job.status === 'ready_for_pickup') {
    return { kind: 'move', status: 'ready_for_fitting', label: 'Start fitting', message: 'Fitting started.' };
  }
  if (fitting && job.status === 'ready_for_fitting') return { kind: 'link', href: open, label: 'Record the fitting' };
  const collect: ReadyAction = canSeeMoney ? { kind: 'link', href: `${open}#payments`, label: `Collect ₱${balance.toLocaleString()}` } : null;
  if (owing && (!released || all)) return collect;
  if (!all) return { kind: 'link', href: open, label: 'Hand over' };
  return { kind: 'move', status: 'completed', label: 'Complete', message: 'Order completed.' };
}
