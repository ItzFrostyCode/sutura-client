'use client';

import { ArrowLeft, Check, Loader2, X } from 'lucide-react';
import type { useServiceGuide } from './useServiceGuide';
import { SERVICE_STEPS } from './serviceSteps';

interface ServiceGuideBarProps {
  readonly guide: ReturnType<typeof useServiceGuide>;
  /** True while the current step's editor is open. */
  readonly editingCurrent: boolean;
  readonly publishing: boolean;
  readonly onPublish: () => void;
  readonly onFinishDraft: () => void;
}

/**
 * The guided setup's progress, pinned under the dashboard header. Each step is one section of the customer's view,
 * in the order the customer reads it; the open box's own Save moves on to the next step.
 */
export default function ServiceGuideBar({ guide, editingCurrent, publishing, onPublish, onFinishDraft }: Readonly<ServiceGuideBarProps>) {
  if (!guide.active) return null;

  return (
    // Docked to the bottom so it stays in view while the page scrolls to each step. Bounded like every overlay
    // (AGENTS.md 1D / 2B): 599px on phones, 680px from tablet up; safe-area padding on phones with a home bar.
    <div className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[599px] min-[600px]:max-w-[680px] border-x border-t border-line bg-white/95 backdrop-blur px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(43,30,26,0.08)]" role="region" aria-label="Service setup">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
          {guide.done ? 'Setup complete' : `New service · Step ${(guide.step ?? 0) + 1} of ${guide.total}`}
        </p>
        <button type="button" onClick={guide.exit} aria-label="Leave the guided setup" className="flex h-11 w-11 items-center justify-center text-ink-muted hover:text-ink cursor-pointer"><X size={18} /></button>
      </div>
      <div className="mt-1 flex gap-1" aria-hidden>
        {SERVICE_STEPS.map((s, i) => <span key={s.section} className={`h-1 flex-1 ${i < (guide.step ?? 0) ? 'bg-espresso' : i === guide.step ? 'bg-taupe' : 'bg-line'}`} />)}
      </div>

      {guide.current ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-ink">{guide.current.title}</p>
            <p className="text-sm text-ink-muted">
              {guide.current.where === 'booking' ? 'Shown to the customer when they book.' : 'Shown on your service page, exactly as below.'}
              {guide.current.optional ? ' Optional.' : ''} {editingCurrent ? 'Fill it in, then press Save on the box.' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {(guide.step ?? 0) > 0 && (
              <button type="button" onClick={guide.back} className="min-h-11 px-3 border border-line text-sm font-medium text-ink hover:bg-sunken flex items-center gap-1.5 cursor-pointer"><ArrowLeft size={15} /> Back</button>
            )}
            {!editingCurrent && (
              <button type="button" onClick={guide.reopen} className="min-h-11 px-4 border border-line text-sm font-medium text-ink hover:bg-sunken cursor-pointer">Open this step</button>
            )}
            {guide.current.optional && (
              <button type="button" onClick={guide.next} className="min-h-11 px-4 bg-sunken text-sm font-semibold text-ink hover:bg-line cursor-pointer">Skip</button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-body">Every section is filled in. Publish it so customers can find it and book, or keep it as a draft.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onFinishDraft} className="min-h-12 px-4 border border-line text-sm font-semibold text-ink hover:bg-sunken cursor-pointer">Keep as draft</button>
            <button type="button" onClick={onPublish} disabled={publishing} className="min-h-12 px-5 bg-espresso text-white text-sm font-semibold hover:bg-espresso/90 flex items-center gap-2 disabled:opacity-60 cursor-pointer">
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Publish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
