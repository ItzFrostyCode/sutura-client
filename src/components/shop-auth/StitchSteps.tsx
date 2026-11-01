import { Check } from 'lucide-react';

/**
 * Progress drawn as a line of stitches: a dashed thread for each step, drawn in ink once it is reached, with the
 * step's name under it. Used by the shop sign-up and the shop application, so both read as one journey.
 */
export default function StitchSteps({ steps, current, label = 'Progress' }: { readonly steps: readonly string[]; readonly current: number; readonly label?: string }) {
  return (
    <ol aria-label={label} className="mb-7 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((name, i) => {
        const n = i + 1;
        const reached = n <= current;
        return (
          <li key={name} aria-current={n === current ? 'step' : undefined}>
            <div aria-hidden className={`border-t-[3px] border-dashed ${reached ? 'border-ink' : 'border-line-strong'}`} />
            <p className={`mt-2 flex items-center gap-1 mobile-overline ${n === current ? 'text-ink' : 'text-ink-muted'}`}>
              {n < current && <Check size={12} strokeWidth={3} />}
              <span className="truncate">{name}</span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}
