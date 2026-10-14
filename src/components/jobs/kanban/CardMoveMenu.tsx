import React, { useEffect, useRef, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { columnsForJobs, type Job } from '../jobHelpers';

interface CardMoveMenuProps {
  readonly job: Job;
  readonly onMove: (job: Job, status: string) => void;
}

/**
 * "Move to…" — the keyboard- and touch-friendly twin of dragging a card. Lists the stages this
 * order can go to, plus On Hold and Cancelled. The server still decides whether the move is allowed.
 */
export default function CardMoveMenu({ job, onMove }: CardMoveMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const stages = columnsForJobs([job]).filter((c) => c.id !== job.status);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Move to…"
        aria-label={`Move ${job.order_number ?? 'order'} to another stage`}
        aria-expanded={open}
        className="h-9 w-9 sm:h-6 sm:w-6 rounded-md border border-line bg-canvas text-ink-muted hover:text-ink hover:border-taupe/60 flex items-center justify-center transition-colors"
      >
        <ArrowRightLeft size={11} />
      </button>
      {open && (
        <ul className="absolute right-0 top-7 z-30 w-44 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-md">
          {stages.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => { setOpen(false); onMove(job, c.id); }}
                className="w-full px-3 py-1.5 text-left text-xs font-medium text-ink-body hover:bg-sunken"
              >
                {c.title}
              </button>
            </li>
          ))}
          {job.status !== 'on_hold' && (
            <li className="border-t border-line mt-1 pt-1">
              <button type="button" onClick={() => { setOpen(false); onMove(job, 'on_hold'); }} className="w-full px-3 py-1.5 text-left text-xs font-medium text-amber-700 hover:bg-amber-50">
                Put on hold
              </button>
            </li>
          )}
          <li>
            <button type="button" onClick={() => { setOpen(false); onMove(job, 'cancelled'); }} className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-700 hover:bg-rose-50">
              Cancel order
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
