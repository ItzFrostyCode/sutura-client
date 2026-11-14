'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { INPUT } from './orderUi';

/**
 * "+ Add" at the end of the Top or the Bottom columns: a small modal asks the measurement's name ("Collar") and adds
 * it as a column right there. A name already in the table is refused, so two columns never mean the same thing.
 */
export default function OrderAddColumn({ part, taken, onAdd }: Readonly<{
  part: 'top' | 'bottom'; taken: string[]; onAdd: (label: string) => void;
}>) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const titleId = useId();
  const clean = name.trim().replace(/\s+/g, ' ');
  const dup = taken.some((t) => t.toLowerCase() === clean.toLowerCase());
  const where = part === 'top' ? 'Top' : 'Bottom';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const add = () => {
    if (!clean || dup) return;
    onAdd(clean);
    setName('');
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Add a ${where} measurement column`}
        className="mx-auto flex h-9 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-line-strong px-3 text-xs font-semibold text-ink hover:border-ink">
        <Plus size={14} aria-hidden /> Add
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4" onClick={() => setOpen(false)}>
          <form role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); add(); }} className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="mobile-h3 text-ink">Add a {where} measurement</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-sunken"><X size={20} /></button>
            </div>
            <label htmlFor={`${titleId}-name`} className="mobile-body-sm mt-2 block text-ink-muted">Its name, as the shop would say it.</label>
            <input id={`${titleId}-name`} autoFocus maxLength={40} value={name} onChange={(e) => setName(e.target.value)}
              placeholder={part === 'top' ? 'e.g. Collar' : 'e.g. Ankle'} className={`${INPUT} mt-2`} />
            {dup && <p className="mobile-caption mt-1.5 text-rose-700">That column is already in the table.</p>}
            <button type="submit" disabled={!clean || dup} className="mt-5 h-12 w-full rounded-xl bg-ink text-base font-semibold text-white disabled:opacity-40">
              Add {clean ? `"${clean}"` : 'column'} to {where}
            </button>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}
