'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import AuthPage from '@/components/auth/AuthPage';
import PasswordField from '@/components/auth/PasswordField';
import DisabledHint from '@/components/shop-auth/DisabledHint';
import { signInError } from '@/components/auth/signInError';
import { meetsPasswordRules } from '@/lib/passwordRules';
import { ERROR_BOX, PRIMARY_BTN, TITLE } from '@/components/auth/authStyles';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-canvas"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [shown, setShown] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // The same rules as Create Account, so a reset can never set a password sign-up would refuse.
  const rulesOk = meetsPasswordRules(password);
  const matches = confirm.length > 0 && confirm === password;
  const hint = !rulesOk ? 'Meet every password rule to continue.' : !matches ? 'Type the same password again to continue.' : '';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rulesOk || !matches) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, email, password, password_confirmation: confirm });
      setDone(true);
    } catch (err) {
      setError(signInError(err, 'This link no longer works. Please request a new one.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <AuthPage back={{ href: '/login', label: 'Sign In' }}>
        <h1 className={`${TITLE} mb-2`}>Link Not Valid</h1>
        <p className="mb-6 text-base text-ink-muted">This reset link is incomplete or has already been used. Ask for a new one — it only takes a moment.</p>
        <Link href="/forgot-password" className={PRIMARY_BTN}>Get a New Link</Link>
      </AuthPage>
    );
  }

  if (done) {
    return (
      <AuthPage>
        <div className="py-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"><Check size={30} aria-hidden /></div>
          <h1 className={`${TITLE} mb-2`}>Password Changed</h1>
          <p className="mb-6 text-base text-ink-muted">Sign in with your new password. Other devices that were signed in have been signed out.</p>
          <button type="button" onClick={() => router.replace('/login')} className={PRIMARY_BTN}>Sign In</button>
        </div>
      </AuthPage>
    );
  }

  return (
    <AuthPage back={{ href: '/login', label: 'Sign In' }}>
      <h1 className={`${TITLE} mb-2`}>Set a New Password</h1>
      <p className="mb-6 text-base text-ink-muted">For <span className="break-words font-medium text-ink">{email}</span></p>

      {error && <div role="alert" className={ERROR_BOX}>{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hidden username so password managers save the new password against the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <PasswordField id="reset-password" label="New password" value={password} onChange={setPassword}
          shown={shown} onToggle={() => setShown((s) => !s)} autoComplete="new-password" withRules />
        <PasswordField id="reset-confirm" label="Confirm new password" value={confirm} onChange={setConfirm}
          shown={shown} autoComplete="new-password" matchWith={password} />
        <button type="submit" disabled={loading || !!hint} aria-describedby={hint ? 'reset-hint' : undefined} className={PRIMARY_BTN}>
          {loading ? 'Saving…' : 'Save New Password'}
        </button>
        {hint && !loading && <DisabledHint id="reset-hint">{hint}</DisabledHint>}
      </form>
    </AuthPage>
  );
}
