'use client';

import { Suspense, useState, SubmitEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import AuthBrand from '@/components/auth/AuthBrand';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (!error.response) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(error.response.data?.message || 'Something went wrong. Please request a new reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />

      {/* Mobile: full edge-to-edge without margins. Tablet/desktop: centered card on canvas. */}
      <div className="flex-1 w-full sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-16">
        <div className="w-full min-h-dvh sm:min-h-0 sm:max-w-md bg-white px-5 py-6 sm:p-8 sm:border sm:border-line sm:shadow-sm">
          <Link
            href="/login"
            aria-label="Back to sign in"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-muted transition-colors py-1.5 -ml-1 mb-4"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>

          <AuthBrand className="mb-8" />

          <h1 className="text-display text-2xl text-ink mb-3">Set New Password</h1>
          <p className="text-sm text-ink-muted mb-6">
            Choose a new password for <span className="text-ink font-medium">{email || 'your account'}</span>.
          </p>

          {!token || !email ? (
            <div className="mb-6 p-4 border border-danger/30 bg-danger/5 text-danger text-sm">
              This reset link is missing or invalid. Please request a new link from the{' '}
              <Link href="/forgot-password" className="underline font-semibold">
                Forgot Password
              </Link>{' '}
              page.
            </div>
          ) : done ? (
            <div className="mb-6 p-4 border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm text-center">
              Password reset successfully. Redirecting you to sign in...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 border border-danger/30 bg-danger/5 text-danger text-sm text-center">
                  {error}
                </div>
              )}

              <div className="relative">
                <label htmlFor="reset-password" className="block text-sm text-ink mb-2">
                  New Password<span className="text-danger">*</span>
                </label>
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 pr-16 border border-line-strong text-ink text-base focus:outline-none focus:border-ink transition-colors"
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 bottom-3 text-sm text-ink underline underline-offset-2"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div>
                <label htmlFor="reset-confirm" className="block text-sm text-ink mb-2">
                  Confirm New Password<span className="text-danger">*</span>
                </label>
                <input
                  id="reset-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full px-3.5 py-3 border border-line-strong text-ink text-base focus:outline-none focus:border-ink transition-colors"
                  placeholder="Re-enter new password"
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-ink hover:bg-ink/90 text-white text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-block text-sm text-ink underline underline-offset-2"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
