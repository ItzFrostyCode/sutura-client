'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/lib/apiError';
import { safeRedirect } from '@/lib/authRedirect';
import AuthPage from '@/components/auth/AuthPage';
import { GOOGLE_REDIRECT_KEY } from '@/components/auth/GoogleSignInButton';
import { ERROR_BOX, PRIMARY_BTN, TITLE } from '@/components/auth/authStyles';

/**
 * Where Google sign-in lands. The server puts a one-time code (or an error) in the URL fragment; this trades the code
 * for a token, signs the customer in, and returns them to the page they started from.
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the code works once; don't send it twice
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname); // keep the code out of history

    const fail = params.get('error');
    const code = params.get('code');
    if (fail || !code) {
      setError(fail || 'Google sign-in didn’t finish. Please try again.');
      return;
    }

    let back = '/';
    try {
      back = safeRedirect(sessionStorage.getItem(GOOGLE_REDIRECT_KEY)) ?? '/';
      sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
    } catch { /* storage blocked: go home */ }

    api.post('/auth/google/exchange', { code })
      .then((res) => {
        const { user, token, store, staff_profile } = res.data.data;
        setAuth(user, token, store ?? undefined, staff_profile ?? undefined);
        router.replace(back);
      })
      .catch((err) => setError(getErrorMessage(err, 'Google sign-in didn’t finish. Please try again.')));
  }, [router, setAuth]);

  if (!error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-4">
        <Loader2 className="animate-spin text-taupe" size={32} aria-hidden="true" />
        <p className="text-base text-ink-muted" role="status">Signing you in with Google…</p>
      </main>
    );
  }

  return (
    <AuthPage close={{ href: '/', label: 'Close' }}>
      <h1 className={`${TITLE} mb-4`}>Couldn&apos;t Sign You In</h1>
      <div role="alert" className={ERROR_BOX}>{error}</div>
      <Link href="/login" className={PRIMARY_BTN}>Back to Sign In</Link>
    </AuthPage>
  );
}
