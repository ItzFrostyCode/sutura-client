import type { MeasurementRequirement } from '@/components/jobs/requirements';
import type { JobCreateForm } from './useJobCreateForm';

/**
 * Whether this order needs body measurements, for deciding what the Sizing step shows. Same order of precedence the server
 * settles an order with (design, then its service, then the shop's default); when nothing says, "the shop measures", which
 * shows the form. It only chooses what to display: the server still applies the real rule to the order.
 */
export function measurementNeed(form: Pick<JobCreateForm, 'design' | 'service' | 'store'>): MeasurementRequirement {
  const rule = form.design?.measurement_requirement ?? form.service?.measurement_requirement ?? form.store?.default_measurement_requirement ?? 'shop';
  // A tailored order is always sized: even a service set to "no measuring" is asked for a size or measurements here.
  return rule === 'none' ? 'shop' : rule;
}

/** The turnaround that applies: the design's own estimate when it has one, else the service's. */
export function turnaroundOf(form: Pick<JobCreateForm, 'design' | 'service'>): { min: number | null; max: number | null; from: 'design' | 'service' | null } {
  const { design, service } = form;
  if (design?.estimated_days) return { min: design.estimated_days, max: design.estimated_days_max ?? null, from: 'design' };
  if (service?.estimated_days) return { min: service.estimated_days, max: service.estimated_days_max ?? null, from: 'service' };
  return { min: null, max: null, from: null };
}
