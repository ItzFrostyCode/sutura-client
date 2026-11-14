'use client';

/** A row of size buttons (one line each, wrapping to the next row on a narrow phone). Tapping the chosen one clears it. */
export default function OrderSizePick({ label, sizes, value, onPick }: Readonly<{
  label: string; sizes: readonly string[]; value: string; onPick: (v: string) => void;
}>) {
  return (
    <div>
      <p className="mobile-h4 mb-2 text-ink">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {sizes.map((s, i) => {
          const on = value === s;
          return (
            <button key={`${i}-${s}`} type="button" role="radio" aria-checked={on} onClick={() => onPick(on ? '' : s)}
              className={`h-11 min-w-12 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-line-strong'}`}>
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
