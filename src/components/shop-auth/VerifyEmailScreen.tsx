'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import AuthShell, { PRIMARY_BTN, TITLE } from './AuthShell';
import VerifiedView from './VerifiedView';

type State = { kind: 'checking' } | { kind: 'ok' } | { kind: 'failed'; message: string };

/** The page the emailed button opens (a new tab): confirms the link, which creates the account. */
export default function VerifyEmailScreen() {
  const [state, setState] = useState<State>({ kind: 'checking' });

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    window.history.replaceState(null, '', '/signup/verify'); // the token is one-use, but there is no reason to keep it in the address bar
    if (!token) { setState({ kind: 'failed', message: 'This link is incomplete. Open it again from your email.' }); return; }
    api.post('/owner-signups/verify', { token })
      .then(() => setState({ kind: 'ok' }))
      .catch((err) => setState({ kind: 'failed', message: getErrorMessage(err, 'We could not confirm this link.') }));
  }, []);

  return (
    <AuthShell>
      {state.kind === 'ok' && <VerifiedView />}
      {state.kind === 'checking' && <p className="py-6 text-center text-sm text-ink-muted">Confirming your email…</p>}
      {state.kind === 'failed' && (
        <div className="text-center py-2">
          <h1 className={`${TITLE} mb-2`}>Link Not Confirmed</h1>
          <p className="mb-6 text-sm text-ink-muted leading-relaxed">{state.message}</p>
          <Link href="/signup/shop" className={PRIMARY_BTN}>Back to Sign Up</Link>
        </div>
      )}
    </AuthShell>
  );
}
