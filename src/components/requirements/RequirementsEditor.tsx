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
  readonly inheritHint?: string;
}

function Choice({
  legend,
  name,
  options,
  value,
  onPick,
  inheritLabel,
  inheritHint,
}: Readonly<{
  legend: string;
  name: string;
  options: { value: string; label: string; hint: string }[];
  value: string;
  onPick: (v: string) => void;
  inheritLabel?: string;
  inheritHint?: string;
}>) {
  const defaultInheritHint =
    inheritHint ??
    (legend === 'Measurements'
      ? 'Default: Shop measures (Staff will take measurements in the shop).'
      : legend === 'Final fitting'
      ? 'Default: Optional (Customers can request a fitting when needed).'
      : legend === 'Payment before production'
      ? 'Default: 50% Deposit required before production starts.'
      : 'Follows your store default requirements in Store Settings.');

  const all = inheritLabel
    ? [{ value: '', label: inheritLabel, hint: defaultInheritHint }, ...options]
    : options;
  const currentOption = all.find((o) => o.value === value);
  const hint = currentOption?.hint;

  return (
    <fieldset>
      <legend className={LABEL}>{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2.5">
        {all.map((o) => (
          <label
            key={o.value || 'inherit'}
            className={`min-h-12 px-4 py-2.5 flex items-center border text-sm min-[600px]:text-base cursor-pointer transition-colors ${
              value === o.value
                ? 'border-taupe bg-sunken font-semibold text-ink shadow-sm'
                : 'border-line-strong bg-white text-ink-body hover:bg-sunken'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onPick(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {hint && (
        <p className="text-sm min-[600px]:text-base text-ink-body font-normal leading-relaxed mt-2.5">
          {hint}
        </p>
      )}
    </fieldset>
  );
}

// Measurement / final fitting / payment-first. Saved onto each job order when it is created.
export default function RequirementsEditor({
  value,
  onChange,
  inheritLabel,
  inheritHint,
}: Readonly<RequirementsEditorProps>) {
  const set = (p: Partial<RequirementsDraft>) => onChange({ ...value, ...p });
  // Normalize legacy 'custom' to 'deposit' so the unified Deposit button is active
  const effectivePaymentPolicy = value.payment_policy === 'custom' ? 'deposit' : value.payment_policy;
  const isDeposit = effectivePaymentPolicy === 'deposit';

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">These are the usual rules. Each new order starts with them, and the owner or a branch manager can change them for one order when they agree it with the customer.</p>
      {inheritLabel && (
        <div className="p-4 bg-sunken/80 border border-line text-sm min-[600px]:text-base text-ink-body leading-relaxed">
          <p>
            <strong className="font-semibold text-ink">New shop?</strong> Don&apos;t worry! Your shop is automatically pre-configured with safe defaults: <span className="font-medium text-ink">Shop measures</span>, <span className="font-medium text-ink">Optional fitting</span>, and <span className="font-medium text-ink">50% deposit</span>. You can simply leave them on &ldquo;{inheritLabel}&rdquo; or pick your preferences below.
          </p>
        </div>
      )}
      <Choice
        legend="Measurements"
        name="req-measure"
        options={MEASUREMENT_OPTIONS}
        value={value.measurement_requirement}
        onPick={(v) => set({ measurement_requirement: v })}
        inheritLabel={inheritLabel}
        inheritHint={inheritHint}
      />
      <Choice
        legend="Final fitting"
        name="req-fitting"
        options={FITTING_OPTIONS}
        value={value.fitting_requirement}
        onPick={(v) => set({ fitting_requirement: v })}
        inheritLabel={inheritLabel}
        inheritHint={inheritHint}
      />
      <Choice
        legend="Payment before production"
        name="req-pay"
        options={PAYMENT_OPTIONS}
        value={effectivePaymentPolicy}
        onPick={(v) => {
          if (v === 'deposit') {
            set({
              payment_policy: 'deposit',
              payment_policy_percent: value.payment_policy_percent || '50',
            });
          } else if (v === 'full') {
            set({
              payment_policy: 'full',
              payment_policy_percent: '100',
            });
          } else if (v === 'none') {
            set({
              payment_policy: 'none',
              payment_policy_percent: '0',
            });
          } else {
            // Inherit default (empty)
            set({
              payment_policy: '',
              payment_policy_percent: '',
            });
          }
        }}
        inheritLabel={inheritLabel}
        inheritHint={inheritHint}
      />
      {isDeposit && (
        <div className="max-w-[240px]">
          <label htmlFor="req-percent" className={LABEL}>Deposit percent required</label>
          <div className="flex items-center gap-2">
            <input
              id="req-percent"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={value.payment_policy_percent || '50'}
              onChange={(e) => set({ payment_policy_percent: e.target.value })}
              placeholder="50"
              className={FIELD}
            />
            <span className="text-base font-medium text-ink-muted">%</span>
          </div>
          <p className="text-sm text-ink-body mt-2 leading-relaxed">Specify downpayment percentage (1–99%).</p>
        </div>
      )}
    </div>
  );
}
