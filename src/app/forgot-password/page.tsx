'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import api from '@/lib/axios';
import AuthPage from '@/components/auth/AuthPage';
import { signInError } from '@/components/auth/signInError';
import { EMAIL_INPUT_PROPS, ERROR_BOX, FIELD, LABEL, OUTLINE_BTN, PRIMARY_BTN, TITLE } from '@/components/auth/authStyles';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) setSent(true);
    } catch (err) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } }).response;
      setError(status?.status === 503
        ? (status.data?.message || 'We couldn’t send the email right now. Please try again in a few minutes.')
        : signInError(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage back={{ href: '/login', label: 'Sign In' }}>
      {sent ? (
        <div className="py-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-line-strong bg-sunken text-espresso">
            <MailCheck size={30} aria-hidden />
          </div>
          <h1 className={`${TITLE} mb-2`}>Check Your Inbox</h1>
          <p className="mb-6 text-base text-ink-muted">
            If an account uses
            <span className="my-1.5 block break-words font-semibold text-ink">{email.trim()}</span>
            you’ll get a link to set a new password in a few minutes. Check your spam folder too.
          </p>
          <Link href="/login" className={PRIMARY_BTN}>Back to Sign In</Link>
          <button type="button" onClick={() => setSent(false)} className="mt-3 flex min-h-11 w-full items-center justify-center text-sm text-ink underline underline-offset-2">
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <h1 className={`${TITLE} mb-2`}>Forgot Password</h1>
          <p className="mb-6 text-base text-ink-muted">Enter the email on your account and we’ll send you a link to set a new password.</p>

          {error && <div role="alert" className={ERROR_BOX}>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className={LABEL}>Email<span className="text-danger">*</span></label>
              <input id="forgot-email" {...EMAIL_INPUT_PROPS} autoComplete="email" placeholder="e.g. maria@gmail.com"
                value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} required />
            </div>
            <button type="submit" disabled={loading} className={PRIMARY_BTN}>{loading ? 'Sending link…' : 'Send Reset Link'}</button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted">Don&apos;t have an account yet?</p>
          <Link href="/register" className={`${OUTLINE_BTN} mt-3`}>Create an Account</Link>
        </>
      )}
    </AuthPage>
  );
}
