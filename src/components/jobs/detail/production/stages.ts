import { Package, Ruler, Scissors, Shirt, Sparkles, Wrench, type LucideIcon } from 'lucide-react';
import type { StepperStage } from '@/components/shared/StatusStepper';
import type { Job } from '../../jobHelpers';
import { lineSteps, STEP_LABEL } from '../../productionLine';

const ICON: Record<string, LucideIcon> = {
  pattern_making: Ruler, mass_cutting_printing: Scissors, cutting: Scissors, sewing: Shirt, qc_ironing: Sparkles, in_repair: Wrench, qc_check: Sparkles,
};
const SHORT: Record<string, string> = { pattern_making: 'Pattern', mass_cutting_printing: 'Mass cut', qc_ironing: 'QC', qc_check: 'QC' };

/** The stepper: the fixed production line, then "Ready" once the quality check has passed. */
export function buildStages(job: Job): StepperStage[] {
  return [
    ...lineSteps(job).map((s) => ({ key: s.status, label: s.label, short: SHORT[s.status] ?? s.label, Icon: ICON[s.status] ?? Wrench })),
    { key: 'ready', label: 'Ready', short: 'Ready', Icon: Package },
  ];
}

/** Which stepper stage lights up for the order's status (a held order shows where it was; fixing shows the quality check). */
export function stepperKey(job: Job): string | null {
  const status = job.status === 'on_hold' ? (job.status_before_hold ?? '') : job.status;
  const qc = lineSteps(job)[lineSteps(job).length - 1].status;
  if (status === 'final_adjustments') return qc;
  if (status === 'pattern_making' || status === 'mass_cutting_printing') return lineSteps(job)[0].status;
  if (['ready_for_pickup', 'ready_for_fitting', 'balance_handover', 'completed'].includes(status)) return 'ready';
  return lineSteps(job).some((s) => s.status === status) ? status : null;
}

export const stepLabel = (status: string) => STEP_LABEL[status] ?? status.replaceAll('_', ' ');
