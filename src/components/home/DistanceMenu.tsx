'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DistanceOption { readonly label: string; readonly value: number | null }

/**
 * Phone distance filter: a chip that opens a small menu under it, right-aligned to the screen edge.
 * Closes on a choice, a tap outside, or Escape.
 */
export default function DistanceMenu({ options, value, onChange, className = '' }: {
  readonly options: readonly DistanceOption[];
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
  readonly className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];
  const on = value !== null;

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${
          on ? 'border-ink bg-ink font-semibold text-white' : 'border-line bg-surface text-ink hover:border-ink'
        }`}
      >
        {current.label}
        <ChevronDown size={16} aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Distance"
          className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.label} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-base transition-colors hover:bg-sunken ${
                    selected ? 'font-semibold text-ink' : 'text-ink-body'
                  }`}
                >
                  {o.label}
                  {selected && <Check size={18} aria-hidden className="shrink-0 text-taupe-dark" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
