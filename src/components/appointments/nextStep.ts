import type { Appointment } from './appointmentHelpers';

/** The one thing to do next with an appointment. Every screen asks this, so the list and the detail always agree. */
export type NextStepKey = 'approve' | 'arrived' | 'done' | 'create_job';

export interface NextStep {
  key: NextStepKey;
  label: string;
}

/**
 * request → Approve · confirmed → Customer arrived (starts the visit) · visit on → Done (then: Create Job Order,
 * Consultation only, or Didn't come) · visit done with no order → Create Job Order. Nothing to do after that.
 */
export function nextStep(apt: Pick<Appointment, 'status' | 'job_order_id' | 'kind' | 'checked_in_at'>, canDecide: boolean): NextStep | null {
  if (apt.status === 'pending') return canDecide ? { key: 'approve', label: 'Approve' } : null;
  // An early customer who already arrived is waiting for their time: the same tap then starts the visit.
  if (apt.status === 'confirmed') return { key: 'arrived', label: apt.checked_in_at ? 'Start visit' : 'Customer arrived' };
  if (apt.status === 'in_progress') return { key: 'done', label: 'Done' };
  if (apt.status === 'completed' && !apt.job_order_id && apt.kind !== 'production') return { key: 'create_job', label: 'Create Job Order' };
  return null;
}
