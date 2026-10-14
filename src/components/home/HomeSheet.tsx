'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';

interface HomeSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
}

/** Bottom sheet on phones (bounded to 599px), centered panel from 640px up. */
export default function HomeSheet({ isOpen, onClose, title, children, footer }: HomeSheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[85dvh] w-full max-w-[599px] flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-[0_-8px_40px_rgba(45,42,38,0.18)] sm:max-w-md sm:rounded-[28px]"
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-5">
          <h2 className="mobile-h4 text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="touch-target-44 -mr-2 flex items-center justify-center text-ink-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-4 pt-1">{children}</div>
        {footer && (
          <div className="shrink-0 px-5 pt-3" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
