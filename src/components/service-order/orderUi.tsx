'use client';

import React from 'react';
import { Info } from 'lucide-react';

export { peso } from './orderMath';

/** Inputs: 48px tall, 16px text (no iOS zoom), one quiet focus ring. */
export const INPUT =
  'h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-faint transition-shadow focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5';
export const TEXTAREA =
  'w-full min-w-0 resize-none rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5';

/** The step's heading: one H2 (the page H1 is "Order online" in the top bar) and one plain sentence. */
export function StepIntro({ title, text }: Readonly<{ title: string; text: string }>) {
  return (
    <div className="space-y-1">
      <h2 className="mobile-h2 text-ink">{title}</h2>
      <p className="mobile-body-sm text-ink-muted">{text}</p>
    </div>
  );
}

export function SectionLabel({ children, htmlFor, as = 'label', hint }: Readonly<{
  children: React.ReactNode; htmlFor?: string; as?: 'label' | 'legend' | 'p'; hint?: string;
}>) {
  const cls = 'mobile-h4 block text-ink';
  const head = as === 'legend' ? <legend className={cls}>{children}</legend>
    : as === 'p' || !htmlFor ? <p className={cls}>{children}</p>
      : <label htmlFor={htmlFor} className={cls}>{children}</label>;
  return (
    <div className="mb-2 space-y-0.5">
      {head}
      {hint && <p className="mobile-body-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

/** "(optional)" after a label, in the quieter tone. */
export const Optional = () => <span className="font-normal text-ink-faint"> (optional)</span>;

export function Card({ children, className = '' }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={`rounded-2xl border border-line bg-surface p-4 sm:p-5 ${className}`}>{children}</div>;
}

/** A short explanation next to what it explains. Never a warning: warnings use Alert. */
export function Tip({ title, children }: Readonly<{ title?: string; children: React.ReactNode }>) {
  return (
    <div className="flex gap-3 rounded-xl bg-sunken px-3.5 py-3">
      <Info size={18} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
      <div className="mobile-body-sm min-w-0 text-ink-body">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Alert({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p role="alert" className="mobile-body-sm rounded-xl bg-rose-50 px-3.5 py-3 text-rose-800">{children}</p>;
}

/** One answer of a single-choice question: a whole-row target with a radio dot, a title and one line of detail. */
export function ChoiceCard({ selected, onSelect, label, detail, trailing, disabled = false }: Readonly<{
  selected: boolean; onSelect: () => void; label: string; detail?: string; trailing?: string; disabled?: boolean;
}>) {
  return (
    <button
      type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={onSelect}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        selected ? 'border-ink bg-surface ring-1 ring-ink' : 'border-line bg-surface hover:border-line-strong'}`}
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-ink bg-ink' : 'border-line-strong'}`}>
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-ink">{label}</span>
        {detail && <span className="mobile-body-sm mt-0.5 block text-ink-muted">{detail}</span>}
      </span>
      {trailing && <span className="shrink-0 whitespace-nowrap text-base font-semibold tabular-nums text-ink">{trailing}</span>}
    </button>
  );
}

/** Two to four short answers in one row (Top · Bottom · Top & Bottom). Labels stay on one line. */
export function Segments<T extends string>({ label, value, onChange, options }: Readonly<{
  label: string; value: T | ''; onChange: (v: T) => void; options: readonly { value: T; label: string }[];
}>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-xl bg-sunken p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`h-11 min-w-0 truncate rounded-lg px-2 text-sm font-medium transition-colors ${on ? 'bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink'}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
