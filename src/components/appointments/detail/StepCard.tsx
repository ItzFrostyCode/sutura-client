import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

/** A white card with a warm hairline and the softest ambient shadow (DESIGN.md, mid level). */
export const CARD = 'rounded-xl border border-line bg-white shadow-[0_1px_3px_rgba(43,30,26,0.04),0_4px_12px_rgba(43,30,26,0.02)]';

/** One numbered step of an appointment: a white card with its number, what it is for, and its content. */
export function StepCard({ n, title, hint, done, optional, children }: Readonly<{ n: number; title: string; hint: string; done?: boolean; optional?: boolean; children: ReactNode }>) {
  return (
    <section className={`${CARD} p-4 sm:p-6`}>
      <header className="mb-5 flex items-center gap-3">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${done ? 'bg-espresso text-white' : 'bg-espresso text-white'}`}>
          {done ? <Check size={13} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink">{title}{optional && <span className="ml-2 text-[13px] font-normal text-ink-muted">Optional</span>}</h2>
          <p className="text-xs text-ink-muted">{hint}</p>
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

/** A small fact on a soft tile: the label above, its value below. */
export function Fact({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-sunken/60 p-3">
      <dt className="text-[11px] font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-[13px] font-medium text-ink">{children}</dd>
    </div>
  );
}

/** A small heading inside a step. */
export function Sub({ children }: Readonly<{ children: ReactNode }>) {
  return <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{children}</h3>;
}
