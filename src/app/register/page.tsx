'use client';

import GenderPicker, { type Gender } from '@/components/shared/GenderPicker';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { Check, MailCheck, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PublicNav from '@/components/shared/PublicNav';
import AuthBrand from '@/components/auth/AuthBrand';
import { PASSWORD_RULES } from '@/lib/passwordRules';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  // Customers only. Shop owners now apply through /register/store (admin
  // reviewed, with documents) — the API no longer accepts role=store_owner
  // here, so old ?as=store_owner links are forwarded there instead.
  const role = 'customer';
  const wantsStore = searchParams.get('as') === 'store_owner';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (wantsStore) router.replace('/register/store');
  }, [wantsStore, router]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const name = fullName.trim();
      const response = await api.post('/auth/register', {
        name, email, password, password_confirmation: passwordConfirmation, role, gender: gender || null
      });
      if (response.data.success) {
        if (response.data.data?.token && response.data.data?.user) {
          useAuthStore.getState().setAuth(response.data.data.user, response.data.data.token);
        }
        setRegisteredEmail(email);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* The site's own nav */}
      <PublicNav />

      {/* Main Container */}
      <div className="flex-1 px-[10px] py-8 md:flex md:items-start md:justify-center md:px-4 md:py-16">
        <div className="md:w-full md:max-w-md md:bg-surface md:border md:border-line md:shadow-sm md:p-8">
          <div className="flex items-center justify-between mb-6">
            <AuthBrand />
            <button
              type="button"
              onClick={() => router.push('/')}
              aria-label="Close"
              className="text-ink-muted hover:text-ink transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          {registeredEmail ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <MailCheck size={32} />
              </div>
              <h1 className="text-display text-2xl text-ink mb-2">Check your email</h1>
              <p className="text-sm text-ink-muted mb-4">
                We sent a confirmation email to <strong className="font-semibold text-ink break-all">{registeredEmail}</strong>.
              </p>
              <div className="text-xs text-ink-body mb-6 bg-sunken p-4 border border-line text-left space-y-2">
                <p>1. Open your Gmail or email inbox and look for the confirmation message from <strong>SUTURA</strong>.</p>
                <p>2. Tap the confirmation link in the email, or click the button below to sign in to your new customer account.</p>
              </div>
              <Link
                href="/login?as=customer"
                className="w-full py-3.5 bg-ink hover:bg-ink/90 text-white text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center"
              >
                Proceed to Customer Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-display text-2xl text-ink mb-6">Create Account</h1>

              {error && (
                <div className="mb-5 p-3.5 border border-danger/30 bg-danger/5 text-danger text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="register-full-name" className="block text-sm text-ink mb-2">
                    Full Name<span className="text-danger">*</span>
                  </label>
                  <input
                    id="register-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3.5 py-3 border border-line-strong text-ink text-[15px] focus:outline-none focus:border-ink transition-colors"
                    required
                  />
                </div>

                <GenderPicker value={gender} onChange={setGender} />

                <div>
                  <label htmlFor="register-email" className="block text-sm text-ink mb-2">
                    Email<span className="text-danger">*</span>
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. maria@gmail.com"
                    className="w-full px-3.5 py-3 border border-line-strong text-ink text-[15px] focus:outline-none focus:border-ink transition-colors"
                    required
                  />
                </div>

                <div>
                  <div className="relative">
                    <label htmlFor="register-password" className="block text-sm text-ink mb-2">
                      Password<span className="text-danger">*</span>
                    </label>
                    <input
                      id="register-password"
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

                  <ul className="mt-3 space-y-1.5">
                    {PASSWORD_RULES.map((rule) => {
                      const met = rule.test(password);
                      return (
                        <li key={rule.key} className="flex items-center gap-2 text-xs">
                          <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            met ? 'bg-taupe border-taupe text-white' : 'border-line-strong text-transparent'
                          }`}>
                            <Check size={10} strokeWidth={3} />
                          </span>
                          <span className={met ? 'text-ink' : 'text-ink-faint'}>{rule.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <label htmlFor="register-password-confirm" className="block text-sm text-ink mb-2">
                    Confirm Password<span className="text-danger">*</span>
                  </label>
                  <input
                    id="register-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full px-3.5 py-3 border border-line-strong text-ink text-[15px] focus:outline-none focus:border-ink transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !PASSWORD_RULES.every((r) => r.test(password))}
                  className="w-full py-3.5 bg-ink hover:bg-ink/90 text-white text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-40"
                >
                  {loading ? 'Creating account...' : 'Create an Account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-ink">
                Already have an account?{' '}
                <a href="/login" className="font-bold underline underline-offset-2">
                  Sign in
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
