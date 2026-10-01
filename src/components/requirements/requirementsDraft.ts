import type { RequirementFields } from '@/components/jobs/requirements';

// '' means "inherit" (design -> service -> shop default).
export interface RequirementsDraft {
  measurement_requirement: string;
  fitting_requirement: string;
  payment_policy: string;
  payment_policy_percent: string;
}

export const emptyRequirementsDraft = (): RequirementsDraft => ({
  measurement_requirement: '', fitting_requirement: '', payment_policy: '', payment_policy_percent: '',
});

export const requirementsToDraft = (r: RequirementFields | null | undefined): RequirementsDraft => ({
  measurement_requirement: r?.measurement_requirement ?? '',
  fitting_requirement: r?.fitting_requirement ?? '',
  payment_policy: r?.payment_policy ?? '',
  payment_policy_percent: r?.payment_policy_percent != null ? String(r.payment_policy_percent) : '',
});

// Percent only matters for deposit / custom; otherwise it is cleared.
export const requirementsPayload = (d: RequirementsDraft) => ({
  measurement_requirement: d.measurement_requirement || null,
  fitting_requirement: d.fitting_requirement || null,
  payment_policy: d.payment_policy || null,
  payment_policy_percent: (d.payment_policy === 'deposit' || d.payment_policy === 'custom') && d.payment_policy_percent
    ? Number.parseInt(d.payment_policy_percent, 10) : null,
});

export function validateRequirements(d: RequirementsDraft): string | null {
  if (d.payment_policy === 'custom') {
    const n = Number(d.payment_policy_percent);
    if (!Number.isInteger(n) || n < 1 || n > 100) return 'Enter the percent required first, from 1 to 100.';
  }
  return null;
}

export const REQUIREMENT_KEYS = ['measurement_requirement', 'fitting_requirement', 'payment_policy', 'payment_policy_percent'] as const;
