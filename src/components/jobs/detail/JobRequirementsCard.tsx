'use client';

import React from 'react';
import { CheckCircle2, Circle, MinusCircle } from 'lucide-react';
import { Job } from '../jobTypes';
import { measurementLabel, paymentPolicyLabel } from '../requirements';

interface Row { label: string; value: string; state: 'done' | 'todo' | 'na'; }

// What this order needs, from the requirements snapshotted when it was created.
export default function JobRequirementsCard({ job, paymentMet }: Readonly<{ job: Job; paymentMet: boolean }>) {
  const measurement = job.measurement_requirement ?? 'none';
  const fitting = job.fitting_requirement ?? 'optional';
  const policy = job.payment_policy ?? 'deposit';

  const rows: Row[] = [
    {
      label: 'Measurements',
      value: measurement === 'none' ? 'Not required' : job.measurement ? `${measurementLabel(measurement)} · on file` : `${measurementLabel(measurement)} · not recorded yet`,
      state: measurement === 'none' ? 'na' : job.measurement ? 'done' : 'todo',
    },
    {
      label: 'Final fitting',
      value: fitting === 'none' ? 'No fitting' : fitting === 'required' ? 'Required before pick-up' : 'Optional',
      state: fitting === 'none' ? 'na' : 'todo',
    },
    {
      label: 'Payment first',
      value: paymentPolicyLabel(policy, job.payment_policy_percent),
      state: policy === 'none' ? 'na' : paymentMet ? 'done' : 'todo',
    },
  ];
  const Icon = { done: CheckCircle2, todo: Circle, na: MinusCircle } as const;
  const tone = { done: 'text-emerald-600', todo: 'text-amber-600', na: 'text-ink-faint' } as const;

  return (
    <section className="bg-surface border border-line p-4" aria-label="Order requirements">
      <h3 className="mobile-overline text-ink-muted">What this order needs</h3>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => {
          const I = Icon[r.state];
          return (
            <li key={r.label} className="flex items-start gap-2.5">
              <I size={18} className={`${tone[r.state]} shrink-0 mt-0.5`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{r.label}</p>
                <p className="text-xs text-ink-muted">{r.value}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-ink-faint mt-3">Copied from the design / service / shop settings when the order was created.</p>
    </section>
  );
}
