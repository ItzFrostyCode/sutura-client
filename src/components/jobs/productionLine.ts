import { isBulkOrder, isRepairOnly, type Job } from './jobHelpers';

export interface LineStep { status: string; label: string }

export const STEP_LABEL: Record<string, string> = {
  design: 'Design', pattern_making: 'Pattern making', mass_cutting_printing: 'Mass cutting', cutting: 'Cutting', sewing: 'Sewing',
  in_repair: 'Repair', qc_ironing: 'Quality check', qc_check: 'Quality check', final_adjustments: 'Fixing',
  ready_for_pickup: 'Ready for pick-up', completed: 'Completed',
};
const step = (status: string): LineStep => ({ status, label: STEP_LABEL[status] ?? status });

/** Orders that use the confirmation flow (not repairs) record a quality-check result; the others have a plain line. Mirrors OrderReadiness::gated. */
export const isGated = (job: Job) => Boolean(job.uses_confirmation_flow) && !isRepairOnly(job);

/** The fixed line an order follows while it is made. Mirrors App\Support\ProductionLine::steps. */
export function lineSteps(job: Job): LineStep[] {
  if (isRepairOnly(job)) return ['in_repair', 'qc_check'].map(step);
  return [isBulkOrder(job) ? 'mass_cutting_printing' : 'pattern_making', 'cutting', 'sewing', 'qc_ironing'].map(step);
}

const slot = (job: Job, status: string) => {
  const s = status === 'pattern_making' || status === 'mass_cutting_printing' ? lineSteps(job)[0].status : status;
  const i = lineSteps(job).findIndex((x) => x.status === s);
  return i < 0 ? null : i;
};

export interface LineView {
  readonly steps: LineStep[];
  /** 0-based place on the line, or null when the order is not on it (design, fixing, ready...). */
  readonly index: number | null;
  readonly next: LineStep | null;
  readonly back: LineStep | null;
  /** At Quality check on an ordered order: passed or sent to be fixed, never Next. */
  readonly atQc: boolean;
}

/** Where the order is on the line and what Next / Back would do. Mirrors ProductionLine::next / previous on the server. */
export function lineView(job: Job): LineView {
  const steps = lineSteps(job);
  const status = job.status;
  const index = slot(job, status);
  const gated = isGated(job);
  const atQc = gated && (status === 'qc_ironing' || status === 'qc_check');
  let next: LineStep | null = null;
  if (status === 'design') next = steps[0];
  else if (status === 'queued' && isRepairOnly(job)) next = step('in_repair');
  else if (!gated && status === 'ready_for_pickup') next = step('completed');
  else if (!gated && status === 'final_adjustments') next = step('qc_ironing');
  else if (!gated && (status === 'qc_ironing' || status === 'qc_check')) next = step('ready_for_pickup');
  else if (index !== null && !atQc && steps[index + 1]) next = steps[index + 1];
  const back = index !== null && index > 0 && !job.qc_passed_at ? steps[index - 1] : null;
  return { steps, index, next, back, atQc };
}
