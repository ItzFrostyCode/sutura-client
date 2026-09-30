'use client';

import React, { useEffect } from 'react';
import OverlayPortal from '@/components/shared/OverlayPortal';
import { useScrollLock } from '@/hooks/useScrollLock';
import { Loader2 } from 'lucide-react';

interface UnsavedChangesModalProps {
  readonly open: boolean;
  readonly saving: boolean;
  readonly onSave: () => void;
  readonly onDiscard: () => void;
  readonly onKeepEditing: () => void;
}

export default function UnsavedChangesModal({ open, saving, onSave, onDiscard, onKeepEditing }: Readonly<UnsavedChangesModalProps>) {
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onKeepEditing();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onKeepEditing]);

  if (!open) return null;

  return (
    <OverlayPortal>
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button type="button" aria-label="Keep editing" onClick={onKeepEditing} className="absolute inset-0 bg-ink/50 cursor-default" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="unsaved-title" className="relative w-full max-w-md max-h-full overflow-y-auto overscroll-contain bg-white border border-line shadow-xl p-5 sm:p-6">
        <h2 id="unsaved-title" className="text-lg font-semibold text-ink">Save your changes?</h2>
        <p className="text-sm text-ink-muted mt-2">
          You edited this section but haven&apos;t saved it yet. If you leave now, those changes will be lost.
        </p>
        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onKeepEditing} disabled={saving} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">
            Keep editing
          </button>
          <button type="button" onClick={onDiscard} disabled={saving} className="h-11 px-5 border border-danger/40 bg-white text-sm font-medium text-danger hover:bg-danger/5 cursor-pointer disabled:opacity-50">
            Discard changes
          </button>
          <button type="button" onClick={onSave} disabled={saving} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />} Save &amp; continue
          </button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  );
}
