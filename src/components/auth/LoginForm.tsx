'use client';

import { useState, SubmitEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import LoginPortalSwitch, { type LoginPortal } from './LoginPortalSwitch';

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
        if (isAuthorized) router.push(staffRedirect);
        else if (customerRedirect) router.push(customerRedirect);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 id={titleId} className="text-display text-2xl text-ink">Sign In</h1>
        <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 -mr-2.5 flex items-center justify-center text-ink">
          <X size={22} />
        </button>
      </div>

      <LoginPortalSwitch value={portal} onChange={(next) => { setPortal(next); setError(''); }} />
      {portal === 'store' && (
        <p className="-mt-3 mb-5 text-sm text-ink-muted">Shop owners, branch managers, and staff sign in here.</p>
      )}

      {error && (
        <div className="mb-5 p-3.5 border border-danger/30 bg-danger/5 text-danger text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="block text-sm text-ink mb-2">
            Email<span className="text-danger">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-3 border border-line-strong text-ink text-base focus:outline-none focus:border-ink transition-colors"
            required
          />
        </div>

        <div className="relative">
          <label htmlFor="login-password" className="block text-sm text-ink mb-2">
            Password<span className="text-danger">*</span>
          </label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-3 pr-16 border border-line-strong text-ink text-base focus:outline-none focus:border-ink transition-colors"
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

        <Link href="/forgot-password" onClick={onDone} className="block text-sm text-ink underline underline-offset-2">
          Forgot Password?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-ink hover:bg-ink/90 text-white text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink">
        {portal === 'store' ? 'Want to sell on SUTURA?' : <>Don&apos;t have an Account?</>}
      </p>

      <Link
        href={portal === 'store' ? '/register/store' : registerHref}
        onClick={onDone}
        className="block w-full mt-4 py-3.5 border border-ink text-ink text-sm font-bold uppercase tracking-widest text-center hover:bg-sunken transition-colors"
      >
        {portal === 'store' ? 'Apply to Open a Shop' : 'Create an Account'}
      </Link>
    </>
  );
}
