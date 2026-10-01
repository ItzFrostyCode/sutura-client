import React from 'react';

export type MeasurementStatusValue = 'finalized' | 'pending_fitting';

export const MEASUREMENT_STATUS_LABEL: Record<MeasurementStatusValue, string> = {
  finalized: 'Finalized',
  pending_fitting: 'Pending fitting',
};

// Finalized = ready to cut from; Pending fitting = needs a fitting check first.
export function MeasurementStatusBadge({ status }: Readonly<{ status?: string | null }>) {
  const pending = status === 'pending_fitting';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${pending ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
      {MEASUREMENT_STATUS_LABEL[pending ? 'pending_fitting' : 'finalized']}
    </span>
  );
}

// Two-choice picker used in the measurement form.
export function MeasurementStatusField({ value, onChange }: Readonly<{ value: MeasurementStatusValue; onChange: (v: MeasurementStatusValue) => void }>) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-ink-body mb-1.5">Status</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Measurement status">
        {(Object.keys(MEASUREMENT_STATUS_LABEL) as MeasurementStatusValue[]).map((v) => (
          <label key={v} className={`min-h-11 px-3 flex items-center border text-sm cursor-pointer ${value === v ? 'border-taupe bg-sunken font-semibold text-ink' : 'border-line-strong bg-white text-ink-body hover:bg-sunken'}`}>
            <input type="radio" name="measurement-status" value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
            {MEASUREMENT_STATUS_LABEL[v]}
          </label>
        ))}
      </div>
      <p className="text-xs text-ink-muted mt-1.5">{value === 'pending_fitting' ? 'Needs a fitting check before the numbers are final.' : 'Ready to cut from.'}</p>
    </fieldset>
  );
}
