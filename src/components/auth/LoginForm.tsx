'use client';

import { useState, SubmitEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import LoginPortalSwitch, { type LoginPortal } from './LoginPortalSwitch';
import { ERROR_BOX, FIELD, LABEL, OUTLINE_BTN, PRIMARY_BTN, SHOW_BTN } from './authStyles';

interface LoginFormProps {
  // Where a customer lands after signing in. null = stay on the current page
  // (the modal case); the /login page passes its ?redirect or '/'.
  readonly customerRedirect: string | null;
  readonly staffRedirect?: string;
  readonly registerHref: string;
  readonly onClose: () => void;
  // Closes the modal after sign-in or when leaving via a link.
  readonly onDone?: () => void;
  readonly titleId?: string;
  readonly initialPortal?: LoginPortal;
  // The /login page uses this to keep the address in step with the tab (/login vs /login?as=store).
  readonly onPortalChange?: (portal: LoginPortal) => void;
}

// The one Sign In card — rendered full-page by /login on mobile and inside
// LoginModal over the current page on tablet/desktop.
export default function LoginForm({
  customerRedirect,
  staffRedirect = '/dashboard',
  registerHref,
  onClose,
  onDone,
  titleId,
  initialPortal = 'customer',
  onPortalChange,
}: LoginFormProps) {
  const [portal, setPortal] = useState<LoginPortal>(initialPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password, portal });
      if (response.data.success) {
        const { user, token, store, staff_profile } = response.data.data;
        const activeStore = store || staff_profile?.store;
        const roleNames = user?.roles?.map((r: { name: string }) => r.name) || [];
        const isAuthorized = roleNames.some((name: string) => ['store_owner', 'branch_manager', 'staff'].includes(name)) || !!staff_profile;
        const isCustomer = roleNames.includes('customer');

        if (!isAuthorized && !isCustomer) {
          setError('This account type does not have a dashboard yet. Please contact support.');
          return;
        }
        setAuth(user, token, activeStore, staff_profile);
        onDone?.();
        // replace, not push: Back from where they land must not show the sign-in page again.
        // A new owner (signed up with their own email) has no shop yet: the application wizard comes first.
        if (roleNames.includes('store_owner') && !activeStore) router.replace('/onboarding');
        else if (isAuthorized) router.replace(staffRedirect);
        else if (customerRedirect) router.replace(customerRedirect);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (!error.response) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error.response.status && error.response.status >= 500) {
        setError('Our service is temporarily unavailable. Please try again in a few moments.');
      } else {
        setError(error.response.data?.message || 'Incorrect email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 id={titleId} className="text-display text-2xl text-ink mb-6">Sign In</h1>

      <LoginPortalSwitch value={portal} onChange={(next) => { setPortal(next); setError(''); onPortalChange?.(next); }} />
      {portal === 'store' && (
        <p className="-mt-3 mb-5 text-sm text-ink-muted">Shop owners, branch managers, and staff sign in here.</p>
      )}

      {error && (
        <div role="alert" className={ERROR_BOX}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className={LABEL}>
            Email<span className="text-danger">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={FIELD}
            required
          />
        </div>

        <div className="relative">
          <label htmlFor="login-password" className={LABEL}>
            Password<span className="text-danger">*</span>
          </label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${FIELD} pr-20`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={SHOW_BTN}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <Link href="/forgot-password" onClick={onDone} className="inline-flex min-h-11 items-center text-sm text-ink underline underline-offset-2">
          Forgot Password?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className={PRIMARY_BTN}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink">
        {portal === 'store' ? 'New to SUTURA for shops?' : <>Don&apos;t have an Account?</>}
      </p>

      <Link
        href={portal === 'store' ? '/signup/shop' : registerHref}
        onClick={onDone}
        className={`${OUTLINE_BTN} mt-4`}
      >
        {portal === 'store' ? 'Create a Shop Account' : 'Create an Account'}
      </Link>
      {portal === 'store' && (
        <Link href="/for-shops" onClick={onDone} className="mt-2 flex min-h-11 items-center justify-center text-sm text-ink-muted underline underline-offset-2 hover:text-ink">
          See how SUTURA works for shops
        </Link>
      )}
    </>
  );
}
