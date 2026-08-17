'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: React.ReactNode;
  readonly children: React.ReactNode;
  /** Desktop max-width class. Ignored on mobile, where the modal is full screen. */
  readonly maxWidth?: string;
  /**
   * Sticky action bar. On mobile it pins to the bottom of the screen (with
   * safe-area padding) so primary actions are always reachable without
   * scrolling — a real bug this app shipped had Approve/Reject pushed below
   * a long list. Pass your Cancel/Confirm row here, not inside children.
   */
  readonly footer?: React.ReactNode;
}

/**
 * The one modal primitive.
 *
 * ≥md: centered panel, dimmed backdrop, rounded corners, max-h-[85vh].
 * <md: FULL SCREEN — inset-0, 100dvh (dvh, not vh: mobile browser chrome),
 *      square corners, no backdrop visible at all, sticky header and footer,
 *      body scrolling between them. A phone user sees an app screen, not a
 *      floating box with the page bleeding through around it.
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md', footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Minimal focus trap: keep Tab cycling inside the panel.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-4">
      {/* Backdrop — only ever seen on desktop; on mobile the panel covers it. */}
      <button
        type="button"
        aria-label="Close modal"
        tabIndex={-1}
        className="fixed inset-0 bg-ink/60 cursor-default w-full h-full border-none p-0 focus:outline-none"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`modal-panel relative bg-surface w-full flex flex-col focus:outline-none overflow-hidden
                   h-[100dvh] max-h-[100dvh] rounded-none border-0
                   md:h-auto md:max-h-[85vh] md:rounded-2xl md:border md:border-line md:shadow-2xl
                   md:animate-rise ${maxWidth}`}
      >
        {/* Sticky header — title always visible, ✕ always reachable. */}
        <div className="sticky top-0 z-10 bg-surface flex items-center justify-between gap-4 px-5 py-4 border-b border-line shrink-0">
          <h2 className="text-lg font-semibold text-ink truncate">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink transition-colors p-2 -m-2 hover:bg-sunken rounded-md shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body — the only part that scrolls. */}
        <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
          {children}
        </div>

        {/* Sticky footer — safe-area padded for the iOS home indicator. */}
        {footer && (
          <div
            className="sticky bottom-0 z-10 bg-surface border-t border-line px-5 py-3 shrink-0
                       flex items-center justify-end gap-3"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
