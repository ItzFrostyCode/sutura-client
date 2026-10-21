import type { ReactNode } from 'react';
import { PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';

export const FIELD = PLAIN_FIELD;
export const LABEL = PLAIN_LABEL;

/** One section of the form: a white card (one level only) with its heading and short line, and plain content inside. */
export default function FormStep({ title, hint, action, children }: Readonly<{ title: string; hint?: string; action?: ReactNode; children: ReactNode }>) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_3px_rgba(43,30,26,0.04),0_4px_12px_rgba(43,30,26,0.02)] sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-espresso">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-espresso/60">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

/** A choice button for small either/or questions: soft cream, and solid espresso when chosen. */
export function Chip({ active, onClick, children }: Readonly<{ active: boolean; onClick: () => void; children: ReactNode }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 shrink-0 cursor-pointer items-center rounded-[10px] border border-espresso/15 px-4 text-sm font-medium transition-colors ${
        active ? 'border-espresso bg-espresso text-white' : 'bg-espresso/[0.05] text-espresso hover:bg-espresso/[0.09]'
      }`}
    >
      {children}
    </button>
  );
}
