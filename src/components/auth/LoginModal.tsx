'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLoginModalStore } from '@/store/useLoginModalStore';
import LoginForm from './LoginForm';
import AuthBrand from './AuthBrand';
import AuthTopBar from './AuthTopBar';
import OverlayPortal from '@/components/shared/OverlayPortal';
import { useScrollLock } from '@/hooks/useScrollLock';

// Tablet/desktop (600px+) Sign In: the same form as /login, floating over the page the customer was on so they stay
// in context. It is a dialog, so it CLOSES (X, Escape, or a click on the dimmed page) — there is no "Back".
export default function LoginModal() {
  const { isOpen, close, redirectTo } = useLoginModalStore();
  const pathname = usePathname();
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  // Navigating away (e.g. the browser Back button) closes it too.
  useEffect(() => { close(); }, [pathname, close]);

  if (!isOpen) return null;

  return (
    <OverlayPortal>
      {/* Below 640px (window resized while open) the same markup is the full-page phone Sign In: no dim, no card. */}
      <div className="fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-white sm:bg-transparent">
        <button type="button" aria-label="Close sign in" tabIndex={-1} onClick={close}
          className="fixed inset-0 hidden cursor-default bg-ink/40 animate-fade-in sm:block" />
        <div className="relative flex min-h-full justify-center sm:items-center sm:p-8">
          <div role="dialog" aria-modal="true" aria-labelledby="login-modal-title"
            className="relative w-full bg-white px-4 pb-10 pt-2 sm:max-w-md sm:rounded-2xl sm:border sm:border-line sm:p-8 sm:pt-4 sm:shadow-xl sm:animate-scale-up">
            <AuthTopBar close={{ onClick: close, label: 'Close sign in' }} />
            <AuthBrand className="mb-6 sm:mb-8" />
            <LoginForm
              customerRedirect={redirectTo}
              registerHref={`/register?redirect=${encodeURIComponent(redirectTo || pathname || '/')}`}
              onDone={close}
              titleId="login-modal-title"
            />
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}
