'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  /** One or two plain sentences. State the consequence, not just "are you sure". */
  readonly message: React.ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Danger styles the confirm button rust; default keeps it taupe. */
  readonly tone?: 'danger' | 'default';
  readonly busy?: boolean;
}

/**
 * Small confirmation dialog — the one overlay allowed to stay centered on
 * mobile (a two-button decision doesn't earn a full screen). Bottom-anchored
 * on phones so both buttons sit in thumb reach, centered on desktop.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        className="fixed inset-0 bg-ink/60 cursor-default w-full h-full border-none p-0 focus:outline-none"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm p-5 focus:outline-none animate-rise"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-start gap-3.5">
          {tone === 'danger' && (
            <div className="w-9 h-9 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <div className="text-sm text-ink-body mt-1.5 leading-relaxed">{message}</div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold text-ink-body hover:bg-sunken transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center gap-2 ${
              tone === 'danger' ? 'bg-danger hover:bg-danger/90' : 'bg-taupe hover:bg-taupe-hover'
            }`}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
