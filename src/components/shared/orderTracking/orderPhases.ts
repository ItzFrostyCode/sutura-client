import {
  AlertCircle, Ban, Clock, Flag, Package, PauseCircle, Palette, Printer, Ruler, Scissors, Shirt, Sparkles, Wrench, type LucideIcon,
} from 'lucide-react';
import type { StepperStage } from '@/components/shared/StatusStepper';

/**
 * The customer's job order tracking, as approved in the leader's build (CUSTOMER-WORKFLOW.md §12): a short phase label
 * from the real `status`, and the full production stepper below it. Internal statuses are never renamed — this is only
 * how they read to a customer. This build's extra statuses (confirmed, awaiting_materials, balance_handover) are mapped
 * onto the nearest approved phase.
 */
export const CUSTOMER_PHASE_STATUS_MAP: Record<string, string> = {
  pending: 'Order Received',
  confirmed: 'Order Received',
  awaiting_materials: 'Order Received',
  queued: 'Order Received',
  production: 'In Production',
  design: 'In Production',
  pattern_making: 'In Production',
  mass_cutting_printing: 'In Production',
  cutting: 'In Production',
  sewing: 'In Production',
  in_repair: 'In Production',
  quality_check: 'Quality Check',
  ready_for_fitting: 'Ready for Fitting',
  adjustments: 'Adjustments',
  final_adjustments: 'Adjustments',
  qc_ironing: 'Quality Check',
  qc_check: 'Quality Check',
  ready_for_pickup: 'Ready for Pickup',
  balance_handover: 'Ready for Pickup',
  completed: 'Completed',
};

/** Exceptions keep their own label (TERMINAL_STATUSES), never folded into a phase. */
export const TERMINAL_STATUSES: Record<string, { label: string; Icon: LucideIcon; tone: string }> = {
  cancelled: { label: 'Cancelled', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
  rejected: { label: 'Rejected', Icon: AlertCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  on_hold: { label: 'On Hold', Icon: PauseCircle, tone: 'text-ink-muted bg-sunken border-line' },
};

export function getCustomerPhase(status: string): string | null {
  return CUSTOMER_PHASE_STATUS_MAP[status] ?? null;
}

const PHASE_TONE: Record<string, { Icon: LucideIcon; tone: string }> = {
  'Order Received': { Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  'In Production': { Icon: Shirt, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  'Ready for Fitting': { Icon: Ruler, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  Adjustments: { Icon: Wrench, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  'Quality Check': { Icon: Sparkles, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  'Ready for Pickup': { Icon: Package, tone: 'text-sage bg-sage/10 border-sage/20' },
  Completed: { Icon: Flag, tone: 'text-sage bg-sage/10 border-sage/20' },
};

/** Label, icon and colour for an order's status badge (list cards, history, measurements). */
export function getPhaseMeta(status: string): { label: string; Icon: LucideIcon; tone: string } {
  const terminal = TERMINAL_STATUSES[status];
  if (terminal) return terminal;
  const phase = getCustomerPhase(status) ?? 'In Production';
  return { label: phase, ...PHASE_TONE[phase] };
}

/** "In Production" on the hub and the orders tab: received and being made (the leader's set, plus this build's extra statuses). */
export const IN_PRODUCTION = new Set([
  'pending', 'confirmed', 'awaiting_materials', 'queued', 'design', 'pattern_making', 'mass_cutting_printing', 'cutting',
  'sewing', 'in_repair', 'ready_for_fitting', 'final_adjustments', 'qc_ironing', 'qc_check', 'on_hold',
]);
export const READY_FOR_PICKUP = new Set(['ready_for_pickup', 'balance_handover']);

/** The stepper's current step: statuses that have no step of their own sit on the nearest one. */
export function stepperKey(status: string): string {
  if (status === 'confirmed' || status === 'awaiting_materials') return 'pending';
  if (status === 'balance_handover') return 'ready_for_pickup';
  return status;
}

const REPAIR_STATUSES = new Set(['queued', 'in_repair', 'qc_check']);
const FITTING_STATUSES = new Set(['ready_for_fitting', 'final_adjustments', 'adjustments']);

/** The production steps to draw for this order: repair, bulk (no fitting) or custom tailoring — the shop's own pipeline. */
export function buildStages(status: string, timestamps?: Record<string, string | null>, pipeline?: 'custom' | 'bulk' | 'repair'): StepperStage[] {
  const withTimes = (list: StepperStage[]) => (timestamps ? list.map((s) => ({ ...s, timestamp: timestamps[s.key] ?? null })) : list);

  if (pipeline === 'repair' || REPAIR_STATUSES.has(status)) {
    return withTimes([
      { key: 'pending', label: 'Pending', Icon: Clock },
      { key: 'queued', label: 'Queued', Icon: Clock },
      { key: 'in_repair', label: 'In Repair', Icon: Wrench },
      { key: 'qc_check', label: 'QC Check', Icon: Sparkles },
      { key: 'ready_for_pickup', label: 'Ready', Icon: Package },
      { key: 'completed', label: 'Completed', Icon: Flag },
    ]);
  }

  const bulk = pipeline === 'bulk' || status === 'mass_cutting_printing';
  const stages: StepperStage[] = [
    { key: 'pending', label: 'Pending', Icon: Clock },
    { key: 'design', label: 'Design', Icon: Palette },
    bulk ? { key: 'mass_cutting_printing', label: 'Mass Cutting & Printing', short: 'Printing', Icon: Printer }
      : { key: 'pattern_making', label: 'Pattern Making', short: 'Pattern', Icon: Ruler },
    { key: 'cutting', label: 'Cutting', Icon: Scissors },
    { key: 'sewing', label: 'Sewing / Assembly', short: 'Sewing', Icon: Shirt },
    { key: 'ready_for_fitting', label: 'Ready for Fitting', short: 'Fitting', Icon: Ruler },
    { key: 'final_adjustments', label: 'Final Adjustments', short: 'Adjust', Icon: Wrench },
    { key: 'qc_ironing', label: 'QC & Ironing', short: 'QC', Icon: Sparkles },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', short: 'Ready', Icon: Package },
    { key: 'completed', label: 'Completed', short: 'Done', Icon: Flag },
  ];
  // A bulk order (team set, uniforms) has no fitting unless it is actually in one.
  return withTimes(pipeline === 'bulk' && !FITTING_STATUSES.has(status) ? stages.filter((s) => !FITTING_STATUSES.has(s.key)) : stages);
}
