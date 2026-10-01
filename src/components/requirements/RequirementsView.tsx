import React from 'react';
import { FITTING_OPTIONS, MEASUREMENT_OPTIONS, paymentPolicyLabel, type RequirementFields } from '@/components/jobs/requirements';

const find = (list: { value: string; label: string }[], v?: string | null) => list.find((o) => o.value === v)?.label;

// Read-only summary of an offering's requirements; unset ones show the fallback.
export default function RequirementsView({ value, fallback = 'Uses the shop default' }: Readonly<{ value: RequirementFields; fallback?: string }>) {
  const rows = [
    ['Measurements', find(MEASUREMENT_OPTIONS, value.measurement_requirement)],
    ['Final fitting', find(FITTING_OPTIONS, value.fitting_requirement)],
    ['Payment first', value.payment_policy ? paymentPolicyLabel(value.payment_policy, value.payment_policy_percent) : undefined],
  ] as const;
  return (
    <dl className="grid grid-cols-1 min-[600px]:grid-cols-3 gap-4">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="mobile-overline text-ink-muted">{k}</dt>
          <dd className={`text-sm mt-1 ${v ? 'text-ink' : 'text-ink-faint'}`}>{v ?? fallback}</dd>
        </div>
      ))}
    </dl>
  );
}
