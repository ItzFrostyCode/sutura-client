import type { ReactNode } from 'react';

export const FIELD =
  'w-full h-11 bg-canvas border border-line rounded-lg px-3 text-base sm:text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe disabled:opacity-50';
export const LABEL = 'block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5';

/** One numbered part of the form. Sections are separated by a rule, not boxed. */
export default function FormStep({ n, title, hint, children }: Readonly<{ n: number; title: string; hint?: string; children: ReactNode }>) {
  return (
    <section className="space-y-4 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-taupe text-xs font-bold text-white">{n}</span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** A pill the owner taps to choose; used for garment categories and small either/or choices. */
export function Chip({ active, onClick, children }: Readonly<{ active: boolean; onClick: () => void; children: ReactNode }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-10 shrink-0 cursor-pointer rounded-lg border px-3 text-sm font-medium transition-colors ${
        active ? 'border-taupe bg-taupe text-white' : 'border-line bg-surface text-ink-muted hover:border-taupe/50 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
