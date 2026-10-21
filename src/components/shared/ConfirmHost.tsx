'use client';

import { useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirmStore } from '@/store/useConfirmStore';

/**
 * Shows the question asked through `confirmDialog()` (or the message from `noticeDialog()`) in the app's ConfirmDialog,
 * instead of the browser's "localhost:3000 says…" box. Rendered once, in the root layout.
 */
export default function ConfirmHost() {
  const open = useConfirmStore((s) => s.open);
  const answer = useConfirmStore((s) => s.answer);

  // Escape answers "no" here only: caught first so a modal underneath does not close as well.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      answer(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, answer]);

  return (
    <ConfirmDialog
      isOpen={!!open}
      onClose={() => answer(false)}
      onConfirm={() => answer(true)}
      title={open?.title ?? ''}
      message={open?.message}
      confirmLabel={open?.confirmLabel ?? (open?.notice ? 'OK' : 'Continue')}
      cancelLabel={open?.cancelLabel}
      tone={open?.danger ? 'danger' : 'default'}
      hideCancel={open?.notice}
    />
  );
}
