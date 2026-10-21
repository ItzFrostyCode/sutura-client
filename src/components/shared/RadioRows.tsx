import type { ReactNode } from 'react';

export interface RadioRow<T extends string> { readonly value: T; readonly title: string; readonly hint?: string; readonly icon?: ReactNode }

/**
 * A flat list of choices: one row each, a round marker, a title and a short line. No box around each choice, so it sits
 * inside a panel without becoming a card in a card. The chosen row is tinted.
 */
export default function RadioRows<T extends string>({ label, value, onChange, options, disabled }: Readonly<{
  label: string; value: T | null | undefined; onChange: (v: T) => void; options: readonly RadioRow<T>[]; disabled?: boolean;
}>) {
  return (
    <div role="radiogroup" aria-label={label} className="divide-y divide-espresso/[0.06]">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => onChange(o.value)}
            className={`flex min-h-12 w-full cursor-pointer items-center gap-3 px-2 py-2.5 text-left transition-colors disabled:cursor-default disabled:opacity-60 ${on ? 'bg-espresso/[0.05]' : 'hover:bg-espresso/[0.03]'}`}
          >
            <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-espresso/25`}>
              {on && <span className="h-2.5 w-2.5 rounded-full bg-espresso" />}
            </span>
            {o.icon && <span className={`shrink-0 text-espresso`}>{o.icon}</span>}
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{o.title}</span>
              {o.hint && <span className="block text-xs text-ink-muted">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
