'use client';

import { useState, SubmitEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import AuthBrand from '@/components/auth/AuthBrand';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSent(true);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (!error.response) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error.response.status === 429) {
        setError(error.response.data?.message || 'Please wait a moment before requesting another reset link.');
      } else if (error.response.status === 503) {
        setError(error.response.data?.message || 'Email delivery failed. Please check your internet connection or mail configuration and try again.');
      } else if (error.response.status && error.response.status >= 500) {
        setError('Our service is temporarily unavailable. Please try again in a few moments.');
      } else {
        setError(error.response.data?.message || 'Something went wrong. Please try again.');
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

          <h1 className="text-display text-2xl text-ink mb-3">Forgot Password</h1>
          <p className="text-sm text-ink-muted mb-6">
            Enter the email on your account and we&apos;ll send you instructions to reset your password.
          </p>

          {sent ? (
            <div className="mb-6 p-4 border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm space-y-1">
              <p className="font-semibold">Check your inbox</p>
              <p>
                If an account exists for <strong className="font-semibold text-ink break-words">{email}</strong>, you’ll receive password-reset instructions shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 border border-danger/30 bg-danger/5 text-danger text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-sm text-ink mb-2">
                  Email<span className="text-danger">*</span>
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 border border-line-strong text-ink text-base focus:outline-none focus:border-ink transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-ink hover:bg-ink/90 text-white text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-ink">
            Don&apos;t have an Account?
          </p>

          <Link
            href="/register"
            className="block w-full mt-4 py-3.5 border border-ink text-ink text-sm font-bold uppercase tracking-widest text-center hover:bg-sunken transition-colors"
          >
            Create an Account
          </Link>

          <p className="mt-5 text-center text-sm text-ink-muted">
            Remember your password?{' '}
            <Link href="/login" className="text-ink underline underline-offset-2 hover:text-ink/80">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
