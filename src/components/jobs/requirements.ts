// Measurement / final-fitting / payment requirements. Mirrors
// App\Support\OrderRequirements on the server. Precedence on the server:
// design -> its linked service -> store default (a combo: own, else store).

export type MeasurementRequirement = 'none' | 'existing' | 'shop';
export type FittingRequirement = 'none' | 'optional' | 'required';
export type PaymentPolicy = 'none' | 'full' | 'deposit' | 'custom';

export interface RequirementFields {
  measurement_requirement?: MeasurementRequirement | null;
  fitting_requirement?: FittingRequirement | null;
  payment_policy?: PaymentPolicy | null;
  payment_policy_percent?: number | null;
}

export const MEASUREMENT_OPTIONS: { value: MeasurementRequirement; label: string; hint: string }[] = [
  { value: 'none', label: 'Not required', hint: 'Ready-made or bulk — no body measurements needed.' },
  { value: 'existing', label: 'Customer-provided', hint: 'Use measurements the customer already has on file.' },
  { value: 'shop', label: 'Shop measures', hint: 'Staff take the measurements in the shop.' },
];

export const FITTING_OPTIONS: { value: FittingRequirement; label: string; hint: string }[] = [
  { value: 'none', label: 'No fitting', hint: 'The order skips the fitting stage.' },
  { value: 'optional', label: 'Optional', hint: 'A fitting can be booked when needed.' },
  { value: 'required', label: 'Required', hint: 'It cannot be handed over before a fitting is done.' },
];

export const PAYMENT_OPTIONS: { value: PaymentPolicy; label: string; hint: string }[] = [
  { value: 'none', label: 'No payment first', hint: 'Production can start without a payment.' },
  { value: 'full', label: 'Full payment', hint: 'Paid in full before production.' },
  { value: 'deposit', label: 'Deposit', hint: 'A deposit before production (default 50%).' },
  { value: 'custom', label: 'Custom percent', hint: 'You choose the percent required first.' },
];

const labelOf = <T extends string>(list: { value: T; label: string }[], v: T | null | undefined) =>
  list.find((o) => o.value === v)?.label ?? '';

export const measurementLabel = (v?: MeasurementRequirement | null) => labelOf(MEASUREMENT_OPTIONS, v);
export const fittingLabel = (v?: FittingRequirement | null) => labelOf(FITTING_OPTIONS, v);

/** Share of the amount due that must be paid before production. */
export function depositFraction(policy?: PaymentPolicy | null, percent?: number | null): number {
  if (policy === 'none') return 0;
  if (policy === 'full') return 1;
  const p = Number(percent ?? 50);
  return Math.max(1, Math.min(100, Number.isFinite(p) ? p : 50)) / 100;
}

/** "No payment first", "Full payment", "50% deposit" … */
export function paymentPolicyLabel(policy?: PaymentPolicy | null, percent?: number | null): string {
  if (policy === 'none') return 'No payment first';
  if (policy === 'full') return 'Full payment';
  return `${Math.round(depositFraction(policy, percent) * 100)}% deposit`;
}

/** Short summary for a settings row, e.g. "Shop measures · Optional fitting · 50% deposit". */
export function requirementsSummary(r: RequirementFields): string {
  return [
    measurementLabel(r.measurement_requirement),
    `${fittingLabel(r.fitting_requirement)} fitting`.replace('No fitting fitting', 'No fitting'),
    paymentPolicyLabel(r.payment_policy, r.payment_policy_percent),
  ].filter(Boolean).join(' · ');
}
