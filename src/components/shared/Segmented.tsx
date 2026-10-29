export interface SegmentedOption<T extends string> { readonly value: T; readonly label: string }

/**
 * A short either/or (or one-of-three) choice in ONE row: equal-width buttons, the chosen one solid espresso. Used wherever the
 * app asks "which one?" with two to four short answers, so Top / Bottom / Top & Bottom and Record / Saved profile look the same everywhere.
 */
export default function Segmented<T extends string>({ label, value, onChange, options, hint, square = false }: Readonly<{
  label: string; value: T; onChange: (v: T) => void; options: readonly SegmentedOption<T>[]; hint?: string;
  /** Square corners and taupe, for the customer-facing pages. */
  square?: boolean;
}>) {
  return (
    <div>
      <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
              className={`flex min-h-11 min-w-0 cursor-pointer items-center justify-center border px-2 py-1 text-center text-[13px] font-medium leading-tight transition-colors sm:text-sm ${square ? 'rounded-none' : 'rounded-xl'} ${on ? (square ? 'border-taupe bg-taupe text-white' : 'border-espresso bg-espresso text-white') : (square ? 'border-line bg-surface text-ink-body hover:border-taupe/50' : 'border-espresso/15 bg-espresso/[0.05] text-espresso hover:bg-espresso/[0.09]')}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-espresso/60">{hint}</p>}
    </div>
  );
}
