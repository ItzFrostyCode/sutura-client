'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

/**
 * An (i) next to a column name. Tapping it opens a small modal in the middle of the screen — a solid card over a dim
 * backdrop, outside the table so it never shifts or overlaps the layout — with how to take that measurement.
 * Closes with "Got it", the ×, Esc, or a tap on the backdrop.
 */
export default function OrderInfoTip({ label, text }: Readonly<{ label: string; text: string }>) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`How to measure ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink">
        <Info size={15} />
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-surface p-5 text-left shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="mobile-h3 text-ink">How to measure: {label}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-sunken">
                <X size={20} />
              </button>
            </div>
            <p className="mobile-body-md mt-2 text-ink-body">{text}</p>
            <p className="mobile-body-sm mt-2 text-ink-muted">Measure the body, not the clothes. Not sure? Leave it blank — the shop measures it.</p>
            <button type="button" onClick={() => setOpen(false)} className="mt-5 h-12 w-full rounded-xl bg-ink text-base font-semibold text-white">Got it</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
