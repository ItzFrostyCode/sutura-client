'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLoginModalStore } from '@/store/useLoginModalStore';
import LoginForm from './LoginForm';
import OverlayPortal from '@/components/shared/OverlayPortal';
import { useScrollLock } from '@/hooks/useScrollLock';

// Tablet/desktop (600px+) Sign In: the same card as /login, floating over
// whatever page the customer was on so they stay in context after signing in.
export default function LoginModal() {
  const { isOpen, close, redirectTo } = useLoginModalStore();
  const pathname = usePathname();
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  // Navigating away (e.g. the browser Back button) closes it too.
  useEffect(() => {
    close();
  }, [pathname, close]);

  if (!isOpen) return null;

  return (
    <OverlayPortal>
      {/* Below 640px (e.g. the window is resized down while it's open) the
          same markup becomes the full-page, edge-to-edge mobile Sign In — no
          overlay, no card. From 640px it is a card centered in the viewport
          (and scrolls inside itself if the screen is shorter than the card). */}
      <div className="fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-canvas sm:bg-transparent">
        <button
          type="button"
          aria-label="Close sign in"
          onClick={close}
          className="hidden sm:block fixed inset-0 bg-ink/40 cursor-default animate-fade-in"
        />
        <div className="relative min-h-full flex sm:items-center justify-center sm:p-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            className="relative w-full px-[10px] py-6 sm:max-w-md sm:bg-surface sm:border sm:border-line sm:shadow-xl sm:p-8 sm:animate-scale-up"
          >
            <LoginForm
              customerRedirect={redirectTo}
              registerHref={`/register?redirect=${encodeURIComponent(redirectTo || pathname || '/')}`}
              onClose={close}
              onDone={close}
              titleId="login-modal-title"
            />
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
