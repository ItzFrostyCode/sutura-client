import { isBulkOrder, isRepairOnly, type Job } from './jobHelpers';
import { depositMet } from './kanban/flowChip';

/** The shop's five stages. Same names the customer sees; the internal tasks (cutting, sewing...) sit inside "Being made". */
export type ShopStageKey = 'request' | 'confirmed' | 'making' | 'ready' | 'done';

export const SHOP_STAGES: { key: ShopStageKey; label: string; hint: string; empty: string }[] = [
  { key: 'request', label: 'Request', hint: 'Price and agreement', empty: 'New requests land here until the price is agreed.' },
  { key: 'confirmed', label: 'Confirmed', hint: 'Agreed, not started', empty: 'Orders wait here once the customer agrees and the deposit is in.' },
  { key: 'making', label: 'Being made', hint: 'On the table', empty: 'Cutting, sewing and the final check happen here.' },
  { key: 'ready', label: 'Ready', hint: 'For fitting or pick-up', empty: 'Finished orders wait here for the fitting or pick-up.' },
  { key: 'done', label: 'Done', hint: 'Handed over', empty: 'Orders handed over to the customer end up here.' },
];

export function shopStageOf(job: Job): ShopStageKey | null {
  const s = job.status;
  if (s === 'cancelled' || s === 'rejected') return null;
  if (s === 'on_hold') return job.production_started_at ? 'making' : job.confirmed_at ? 'confirmed' : 'request';
  if (s === 'pending') return 'request';
  if (['confirmed', 'awaiting_materials', 'queued'].includes(s)) return 'confirmed';
  if (s === 'completed') return 'done';
  if (['ready_for_pickup', 'balance_handover'].includes(s)) return 'ready';
  if (s === 'ready_for_fitting') return job.uses_confirmation_flow ? 'ready' : 'making';
  return 'making';
}

const TASK_LABEL: Record<string, string> = {
  design: 'Design', pattern_making: 'Pattern', mass_cutting_printing: 'Mass cutting', cutting: 'Cutting', sewing: 'Sewing',
  qc_ironing: 'Final check', qc_check: 'Final check', in_repair: 'Repair', final_adjustments: 'Adjusting', ready_for_fitting: 'Fitting',
};

/** One short line: what this order is doing, or what it is waiting for. */
export function stageNote(job: Job): string {
  const s = job.status;
  if (s === 'on_hold') return 'On hold';
  if (s === 'cancelled') return 'Cancelled';
  if (s === 'rejected') return 'Not accepted';
  if (s === 'pending') {
    if (!job.uses_confirmation_flow) return 'Waiting to start';
    if (!job.shop_accepted_at) return 'New request — needs your review';
    if (!job.quotation_status) return 'Needs a price';
    if (job.quotation_status === 'estimate') return 'Estimate only';
    if (!job.customer_approved_at) return job.customer_decision === 'changes_requested' ? 'Customer asked for changes' : 'Waiting for the customer';
    if (!depositMet(job)) return 'Waiting for the deposit';
    return 'Ready to confirm';
  }
  if (s === 'confirmed') return 'Ready to start';
  if (s === 'awaiting_materials') return 'Waiting for materials';
  if (s === 'queued') return 'In line';
  if (s === 'ready_for_pickup') return job.fitting_requirement === 'none' ? 'Ready for pick-up' : 'Ready — fitting or pick-up';
  if (s === 'balance_handover') return 'Paying the balance';
  if (s === 'completed') return 'Handed over';
  return TASK_LABEL[s] ?? s.replaceAll('_', ' ');
}

/** The next task on the table, for the one-tap button on a card. Final check and later steps happen on the order page. */
export function nextTask(job: Job): { status: string; label: string } | null {
  const next: Record<string, string> = isRepairOnly(job)
    ? { queued: 'in_repair', in_repair: 'qc_check' }
    : { design: isBulkOrder(job) ? 'mass_cutting_printing' : 'pattern_making', pattern_making: 'cutting', mass_cutting_printing: 'cutting', cutting: 'sewing', sewing: 'qc_ironing' };
  const to = next[job.status];
  return to ? { status: to, label: TASK_LABEL[to] ?? to } : null;
}

/** True when the next move is the shop's, not the customer's: worth a highlight on the board. */
export function needsShop(job: Job): boolean {
  if (job.status === 'pending' && job.uses_confirmation_flow) {
    if (!job.shop_accepted_at || !job.quotation_status || job.quotation_status === 'estimate') return true;
    if (job.customer_decision === 'changes_requested') return true;
    return Boolean(job.customer_approved_at && depositMet(job));
  }
  return job.status === 'confirmed' || job.status === 'awaiting_materials';
}
