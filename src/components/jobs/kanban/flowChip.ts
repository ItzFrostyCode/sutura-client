import { depositFraction } from '../requirements';
import type { Job } from '../jobHelpers';

export interface FlowChip {
  label: string;
  cls: string;
}

const AMBER = 'bg-amber-50 text-amber-800 border-amber-200';
const SKY = 'bg-sky-50 text-sky-800 border-sky-200';
const ROSE = 'bg-rose-50 text-rose-700 border-rose-200';
const GREEN = 'bg-emerald-50 text-emerald-700 border-emerald-200';

const num = (v: unknown) => Number.parseFloat(String(v ?? '0')) || 0;

/** True when the verified payments already cover this order's required deposit (same maths as the server). */
export function depositMet(job: Job): boolean {
  const total = num(job.total_amount);
  const discount = num(job.discount_amount);
  const paid = total - num(job.balance) - discount;
  const required = depositFraction(job.payment_policy, job.payment_policy_percent) * Math.max(0, total - discount);
  return required <= 0 || paid + 0.005 >= required;
}

/**
 * The one thing a pending order is waiting on, so the owner can scan the board for what needs them.
 * Only orders that use the ordering flow get a chip; the rest keep the plain Pending card.
 */
export function flowChip(job: Job): FlowChip | null {
  if (!job.uses_confirmation_flow) return null;
  if (job.status === 'awaiting_materials') return { label: 'Waiting for materials', cls: AMBER };
  if (job.status !== 'pending') return null;
  if (!job.quotation_status) return { label: 'Needs quotation', cls: AMBER };
  if (job.quotation_status === 'estimate') return { label: 'Estimate only', cls: AMBER };
  if (!job.customer_approved_at) return { label: 'Awaiting customer', cls: SKY };
  if (!depositMet(job)) return { label: 'Deposit due', cls: ROSE };
  if (!job.specs_approved_at) return { label: 'Approve specs', cls: AMBER };
  return { label: 'Ready to confirm', cls: GREEN };
}
