'use client';

import React from 'react';
import { FIELD, LABEL } from '@/components/catalog/editable/editors/fieldStyles';
import { FITTING_OPTIONS, MEASUREMENT_OPTIONS, PAYMENT_OPTIONS } from '@/components/jobs/requirements';
import type { RequirementsDraft } from './requirementsDraft';

interface RequirementsEditorProps {
  readonly value: RequirementsDraft;
  readonly onChange: (next: RequirementsDraft) => void;
  // Text for the "inherit" choice, e.g. "Use the shop default". Omit for the shop-default editor itself.
  readonly inheritLabel?: string;
}

function Choice({ legend, name, options, value, onPick, inheritLabel }: Readonly<{
  legend: string; name: string; options: { value: string; label: string; hint: string }[];
  value: string; onPick: (v: string) => void; inheritLabel?: string;
}>) {
  const all = inheritLabel ? [{ value: '', label: inheritLabel, hint: '' }, ...options] : options;
  const hint = options.find((o) => o.value === value)?.hint;
  return (
    <fieldset>
      <legend className={LABEL}>{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {all.map((o) => (
          <label key={o.value || 'inherit'} className={`min-h-11 px-3 flex items-center border text-sm cursor-pointer ${value === o.value ? 'border-taupe bg-sunken font-semibold text-ink' : 'border-line-strong bg-white text-ink-body hover:bg-sunken'}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onPick(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
      {hint && <p className="text-xs text-ink-muted mt-1.5">{hint}</p>}
    </fieldset>
  );
}

// Measurement / final fitting / payment-first. Saved onto each job order when it is created.
export default function RequirementsEditor({ value, onChange, inheritLabel }: Readonly<RequirementsEditorProps>) {
  const set = (p: Partial<RequirementsDraft>) => onChange({ ...value, ...p });
  const needsPercent = value.payment_policy === 'deposit' || value.payment_policy === 'custom';
  return (
    <div className="space-y-5">
      <Choice legend="Measurements" name="req-measure" options={MEASUREMENT_OPTIONS} value={value.measurement_requirement} onPick={(v) => set({ measurement_requirement: v })} inheritLabel={inheritLabel} />
      <Choice legend="Final fitting" name="req-fitting" options={FITTING_OPTIONS} value={value.fitting_requirement} onPick={(v) => set({ fitting_requirement: v })} inheritLabel={inheritLabel} />
      <Choice legend="Payment before production" name="req-pay" options={PAYMENT_OPTIONS} value={value.payment_policy} onPick={(v) => set({ payment_policy: v, payment_policy_percent: v === 'deposit' && !value.payment_policy_percent ? '50' : value.payment_policy_percent })} inheritLabel={inheritLabel} />
      {needsPercent && (
        <div className="max-w-[200px]">
          <label htmlFor="req-percent" className={LABEL}>Percent required first</label>
          <div className="flex items-center gap-2">
            <input id="req-percent" type="number" inputMode="numeric" min={1} max={100} value={value.payment_policy_percent} onChange={(e) => set({ payment_policy_percent: e.target.value })} placeholder="50" className={FIELD} />
            <span className="text-sm text-ink-muted">%</span>
          </div>
        </div>
      )}
    </div>
  );
}
