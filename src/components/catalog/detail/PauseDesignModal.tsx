'use client';

import React, { useEffect } from 'react';
import OverlayPortal from '@/components/shared/OverlayPortal';
import { useScrollLock } from '@/hooks/useScrollLock';
import { EyeOff, Check, Loader2 } from 'lucide-react';

interface PauseDesignModalProps {
  readonly open: boolean;
  readonly designName: string;
  readonly pausing: boolean;
  /** What is being paused — "design" (default) or "service". */
  readonly noun?: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

const HIDDEN = [
  'Not shown in search, your store profile, or as a related design.',
  'Its own page stops working for customers, so they can’t open it, save it, or book from it.',
];
const KEPT = [
  'Nothing is deleted — photos, reviews and sales history stay.',
  'Orders and appointments already made for this {noun} carry on as normal.',
  'You can still see and edit it here, and turn it back on anytime with Activate.',
];

export default function PauseDesignModal({ open, designName, pausing, noun = 'design', onConfirm, onCancel }: Readonly<PauseDesignModalProps>) {
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !pausing && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, pausing, onCancel]);

  if (!open) return null;

  return (
    <OverlayPortal>
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button type="button" aria-label="Cancel" onClick={onCancel} disabled={pausing} className="absolute inset-0 bg-ink/50 cursor-default" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="pause-title" className="relative w-full max-w-md max-h-full overflow-y-auto overscroll-contain bg-white border border-line shadow-xl p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 shrink-0 bg-sunken border border-line flex items-center justify-center text-ink-muted"><EyeOff size={18} /></span>
          <h2 id="pause-title" className="text-lg font-semibold text-ink leading-snug">Pause this {noun}?</h2>
        </div>
        <p className="text-sm text-ink-muted mt-3">
          <span className="font-semibold text-ink">{designName}</span> will be hidden from customers until you activate it again.
        </p>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5">What customers will see</p>
            <ul className="space-y-1.5">
              {HIDDEN.map(t => (
                <li key={t} className="flex gap-2 text-ink-body"><EyeOff size={15} className="shrink-0 mt-0.5 text-ink-muted" />{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink mb-1.5">What stays the same</p>
            <ul className="space-y-1.5">
              {KEPT.map(t => (
                <li key={t} className="flex gap-2 text-ink-body"><Check size={15} className="shrink-0 mt-0.5 text-sage" />{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={pausing} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">
            Keep it live
          </button>
          <button type="button" onClick={onConfirm} disabled={pausing} className="h-11 px-5 bg-ink hover:bg-ink/90 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {pausing && <Loader2 size={16} className="animate-spin" />} Pause {noun}
          </button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  );
}
