'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';

/**
 * Pop-up shown when a customer tries to order online from a shop that hasn't
 * set up a GCash account: payment is due up front, so there is nowhere to pay.
 */
export default function NoGcashAlert({
  open,
  onClose,
  storeSlug,
  message = "This shop hasn't set up a GCash account for payments. Please check back later, or book an appointment with the shop instead.",
}: Readonly<{ open: boolean; onClose: () => void; storeSlug: string; message?: string }>) {
  const okRef = useRef<HTMLButtonElement>(null);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink/40 cursor-default" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="no-gcash-title"
        aria-describedby="no-gcash-text"
        className="relative w-full max-w-sm rounded-2xl bg-surface border border-line shadow-[0_12px_40px_rgba(45,42,38,0.18)] p-6 text-center animate-rise"
      >
        <span className="mx-auto mb-3 w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <h2 id="no-gcash-title" className="text-base font-bold text-ink">You can&apos;t place this order yet</h2>
        <p id="no-gcash-text" className="mt-1.5 text-sm text-ink-body leading-relaxed">{message}</p>
        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2">
          <button
            ref={okRef}
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-lg border border-line-strong bg-surface text-sm font-semibold text-ink hover:bg-sunken transition-colors"
          >
            OK
          </button>
          <Link
            href={`/store/${storeSlug}/book`}
            className="flex-1 h-11 rounded-lg bg-taupe hover:bg-ink text-white text-sm font-semibold flex items-center justify-center transition-colors"
          >
            Book an appointment
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
