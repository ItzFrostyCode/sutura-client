'use client';

import React from 'react';
import { CheckCircle2, Circle, ListChecks, MinusCircle } from 'lucide-react';
import { Job } from '../jobTypes';
import type { RosterMember } from '../form/types';
import { customParts, hasAllSizes } from '../form/rosterHelpers';
import { jobGarments, jobSoldAsSet, orderedLabel } from '@/lib/orderSize';
import { garmentsLabel, optionLine, type Covers, type SoldAs } from '@/lib/orderUnits';
import { measurementLabel, paymentPolicyLabel } from '../requirements';
import OrderRulesButton from './OrderRulesButton';
import SectionHeader from '../ui/SectionHeader';

interface Row { label: string; value: string; state: 'done' | 'todo' | 'na'; }

/**
 * What was actually recorded, so a standard size is never mistaken for body measurements (or for "not required"):
 * a team counts its people with a size, a one-wearer order says standard size or measured profile.
 */
function sizing(job: Job, rule: string): { value: string; state: Row['state'] } {
  const cod = job.custom_order_data ?? {};
  const roster = Array.isArray(cod.team_roster) ? (cod.team_roster as Record<string, unknown>[]) : [];
  if (roster.length > 0) {
    const asPerson = (r: Record<string, unknown>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'string' ? v : ''])) as RosterMember;
    const custom = roster.filter((r) => customParts(asPerson(r as Record<string, unknown>)).length > 0);
    const unmeasured = custom.filter((r) => !String(r.measurement_id ?? '').trim() && !String(r.fit ?? '').trim()).length;
    const unsized = roster.filter((r) => !hasAllSizes(asPerson(r as Record<string, unknown>))).length;
    const open = unsized + unmeasured;
    const parts = [`${roster.length - unsized} of ${roster.length} people sized`];
    if (custom.length > 0) parts.push(`${custom.length - unmeasured} of ${custom.length} Custom Fit measured`);
    return { value: parts.join(' · '), state: open > 0 ? 'todo' : 'done' };
  }
  if (job.measurement) return { value: `Body measurements · ${job.measurement.profile_name}`, state: 'done' };
  if (typeof cod.standard_size === 'string' && cod.standard_size) return { value: `Standard size ${cod.standard_size} · no body measurements`, state: 'done' };
  if (cod.size_breakdown && typeof cod.size_breakdown === 'object') return { value: 'Standard sizes per piece · no body measurements', state: 'done' };
  return rule === 'none'
    ? { value: 'Nothing recorded · the service does not ask for it', state: 'na' }
    : { value: `${measurementLabel(rule as Parameters<typeof measurementLabel>[0])} · not recorded yet`, state: 'todo' };
}

// What this order needs, from the requirements snapshotted when it was created.
export default function JobRequirementsCard({ job, paymentMet, onChanged }: Readonly<{ job: Job; paymentMet: boolean; onChanged?: () => Promise<void> | void }>) {
  const measurement = job.measurement_requirement ?? 'none';
  const fitting = job.fitting_requirement ?? 'optional';
  const policy = job.payment_policy ?? 'deposit';

  // The option the order was made from, in the same words as where it is set (service editor) and chosen (the order forms).
  const cod = job.custom_order_data ?? {};
  const optionName = typeof cod.option === 'string' ? cod.option : '';
  const optionFacts = optionLine({ covers: (cod.option_covers as Covers | undefined) ?? null, sold_as: (cod.option_sold_as as SoldAs | undefined) ?? null });
  const optionRows: Row[] = optionName || optionFacts
    ? [
      { label: 'Option', value: [optionName, optionFacts].filter(Boolean).join(' · '), state: 'done' },
      { label: 'Ordered', value: `${orderedLabel(job)}${jobSoldAsSet(job) ? ` · ${garmentsLabel(jobGarments(job))}` : ''}`, state: 'done' },
    ]
    : [];

  const rows: Row[] = [
    ...optionRows,
    { label: 'Sizing', ...sizing(job, measurement) },
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
