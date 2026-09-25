'use client';

import { useState, SubmitEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Loader2 } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user, token, store, staff_profile } = response.data.data;
        const activeStore = store || staff_profile?.store;
        const roleNames = user?.roles?.map((r: { name: string }) => r.name) || [];
        const isAuthorized = roleNames.some((name: string) => ['store_owner', 'branch_manager', 'staff'].includes(name)) || !!staff_profile;
        const isCustomer = roleNames.includes('customer');

        if (isAuthorized) {
          setAuth(user, token, activeStore, staff_profile);
          router.push(redirectPath || '/dashboard');
        } else if (isCustomer) {
          setAuth(user, token, activeStore, staff_profile);
          router.push(redirectPath || '/account');
        } else {
          setError('This account type does not have a dashboard yet. Please contact support.');
          setLoading(false);
          return;
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* PublicNav only on tablet/desktop — on mobile the form's own
          Sign In/X header is the only chrome this page needs, and having
          both stacked read as redundant. */}
      <div className="hidden md:block">
        <PublicNav />
      </div>

      {/* Mobile (below md): full page, edge-to-edge, same as before.
          Tablet/desktop: the form no longer stretches full-bleed — it sits
          centered in a modal-like card instead, since a wide flat form
          with edge-to-edge inputs looked broken at those widths. */}
      <div className="flex-1 px-[10px] py-6 md:flex md:items-start md:justify-center md:px-4 md:py-16">
        <div className="md:w-full md:max-w-md md:bg-surface md:border md:border-line md:shadow-sm md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-display text-2xl text-ink">Sign In</h1>
          <button
            type="button"
            onClick={() => router.push('/')}
            aria-label="Close"
            className="p-1 text-ink"
          >
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 border border-danger/30 bg-danger/5 text-danger text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm text-ink mb-2">
              Email<span className="text-danger">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 border border-line-strong text-ink text-[15px] focus:outline-none focus:border-ink transition-colors"
              required
            />
          </div>

          <div>
            <div className="relative">
              <label htmlFor="password" className="block text-sm text-ink mb-2">
                Password<span className="text-danger">*</span>
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 pr-16 border border-line-strong text-ink text-[15px] focus:outline-none focus:border-ink transition-colors"
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
          </div>

          <a href="/forgot-password" className="block text-sm text-ink underline underline-offset-2">
            Forgot Password?
          </a>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-ink hover:bg-ink/90 text-white text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink">Don&apos;t have an Account?</p>

        <a
          href="/register"
          className="block w-full mt-4 py-3.5 border border-ink text-ink text-sm font-bold uppercase tracking-widest text-center hover:bg-sunken transition-colors"
        >
          Create an Account
        </a>
        </div>
      </div>
    </div>
  );
}
