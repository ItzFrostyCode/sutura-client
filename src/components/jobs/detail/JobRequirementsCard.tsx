'use client';

import React from 'react';
import { CheckCircle2, Circle, ListChecks, MinusCircle } from 'lucide-react';
import { Job } from '../jobTypes';
import { measurementLabel, paymentPolicyLabel } from '../requirements';
import OrderRulesButton from './OrderRulesButton';
import SectionHeader from '../ui/SectionHeader';

interface Row { label: string; value: string; state: 'done' | 'todo' | 'na'; }

// What this order needs, from the requirements snapshotted when it was created.
export default function JobRequirementsCard({ job, paymentMet, onChanged }: Readonly<{ job: Job; paymentMet: boolean; onChanged?: () => Promise<void> | void }>) {
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
      label: 'Payment before work starts',
      value: paymentPolicyLabel(policy, job.payment_policy_percent),
      state: policy === 'none' ? 'na' : paymentMet ? 'done' : 'todo',
    },
  ];
  const Icon = { done: CheckCircle2, todo: Circle, na: MinusCircle } as const;
  const tone = { done: 'text-emerald-600', todo: 'text-amber-600', na: 'text-ink-faint' } as const;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6" aria-label="Order requirements">
      <SectionHeader icon={ListChecks} title="What this order needs" as="h3" />
      <ul className="mt-4 space-y-4">
        {rows.map((r) => {
          const I = Icon[r.state];
          return (
            <li key={r.label} className="flex items-start gap-2.5">
              <I size={18} className={`${tone[r.state]} shrink-0 mt-0.5`} />
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-ink">{r.label}</p>
                <p className="text-[13px] text-ink-muted">{r.value}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 rounded-xl bg-amber-500/[0.07] px-3.5 py-3 text-[13px] text-ink-body">Copied from the service when this order was made. You can change them for this order only.</p>
      <div className="mt-auto pt-4"><OrderRulesButton job={job} onChanged={onChanged} variant="button" /></div>
    </section>
  );
}
