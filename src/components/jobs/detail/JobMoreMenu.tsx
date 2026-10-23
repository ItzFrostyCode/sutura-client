'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CalendarPlus, CopyPlus, Mail, MoreHorizontal, Printer, Archive, Ban } from 'lucide-react';

interface Props {
  readonly onPrint: () => void;
  /** Owner / branch manager only (the server refuses staff). */
  readonly onMessage?: () => void;
  readonly onFollowUpVisit: () => void;
  /** Owner / branch manager, completed orders only: opens the follow-up panel on the Steps tab. */
  readonly onFollowUpOrder?: () => void;
  readonly onArchive?: () => void;
  /** Owner / branch manager, ongoing orders only: opens the cancel panel on the Steps tab. */
  readonly onCancel?: () => void;
  /** Extra actions for the owner or a branch manager (for example splitting the order). */
  readonly extra?: { label: string; icon: React.ReactNode; onClick: () => void }[];
}

const ITEM = 'flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 text-left text-sm font-medium text-ink hover:bg-espresso/[0.04]';

/** The rarely used order actions, in one place: the page keeps a single main button. A bottom sheet on phones, a menu on larger screens. */
export default function JobMoreMenu({ onPrint, onMessage, onFollowUpVisit, onFollowUpOrder, onArchive, onCancel, extra = [] }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const run = (fn: () => void) => () => { setOpen(false); fn(); };

  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="More actions" onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-sunken">
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-espresso/30 sm:hidden" aria-hidden />
          <div role="menu" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[599px] rounded-t-2xl border border-espresso/[0.08] bg-white pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 sm:rounded-xl sm:pb-2">
            <button type="button" role="menuitem" onClick={run(onPrint)} className={ITEM}><Printer size={17} className="text-ink-muted" /> Print work ticket</button>
            {onMessage && <button type="button" role="menuitem" onClick={run(onMessage)} className={ITEM}><Mail size={17} className="text-ink-muted" /> Message the customer</button>}
            <button type="button" role="menuitem" onClick={run(onFollowUpVisit)} className={ITEM}><CalendarPlus size={17} className="text-ink-muted" /> Schedule a follow-up visit</button>
            {onFollowUpOrder && <button type="button" role="menuitem" onClick={run(onFollowUpOrder)} className={ITEM}><CopyPlus size={17} className="text-ink-muted" /> New follow-up order</button>}
            {extra.map((x) => <button key={x.label} type="button" role="menuitem" onClick={run(x.onClick)} className={ITEM}><span className="text-ink-muted">{x.icon}</span> {x.label}</button>)}
            {onCancel && (
              <>
                <div className="my-1 border-t border-espresso/[0.08]" />
                <button type="button" role="menuitem" onClick={run(onCancel)} className={`${ITEM} bg-rose-500/[0.07] text-rose-700 hover:bg-rose-500/[0.12]`}><Ban size={17} /> Cancel this order</button>
              </>
            )}
            {onArchive && (
              <>
                <div className="my-1 border-t border-espresso/[0.08]" />
                <button type="button" role="menuitem" onClick={run(onArchive)} className={ITEM}><Archive size={17} className="text-ink-muted" /> Archive this order</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
