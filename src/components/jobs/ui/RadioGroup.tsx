import type { ReactNode } from 'react';

export interface RadioOption { value: string; label: string; hint?: ReactNode }

interface RadioGroupProps {
  readonly name: string;
  readonly legend: string;
  readonly options: readonly RadioOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}

/** A plain list of radio choices with a legend. Each row is at least 44px tall so it is easy to tap. */
export default function RadioGroup({ name, legend, options, value, onChange }: Readonly<RadioGroupProps>) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-espresso">{legend}</legend>
      <div className="space-y-1">
        {options.map((o) => (
          <label key={o.value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-1 py-2.5 text-sm text-ink hover:bg-espresso/[0.03]">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-0.5 h-4 w-4 shrink-0 accent-espresso" />
            <span className="min-w-0">
              <span className="block">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-[13px] text-ink-muted">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
