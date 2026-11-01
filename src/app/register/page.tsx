'use client';

import GenderPicker, { type Gender } from '@/components/shared/GenderPicker';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, Check, MailCheck, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PublicNav from '@/components/shared/PublicNav';
import AuthBrand from '@/components/auth/AuthBrand';
import AccountTypeTabs from '@/components/shop-auth/AccountTypeTabs';
import { PASSWORD_RULES } from '@/lib/passwordRules';
import { ERROR_BOX, FIELD, LABEL, PRIMARY_BTN, SHOW_BTN } from '@/components/auth/authStyles';
import TermsConsent from '@/components/shop-auth/TermsConsent';
import DisabledHint from '@/components/shop-auth/DisabledHint';
import { destinationFor, safeRedirect, withRedirect } from '@/lib/authRedirect';

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
  const redirect = safeRedirect(searchParams.get('redirect'));

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (wantsStore) router.replace('/signup/shop');
  }, [wantsStore, router]);

  // Already signed in (Back, or an old link): go on, and take this page out of the history.
  const { user: signedIn, staffProfile, hydrated } = useAuthStore();
  useEffect(() => {
    if (hydrated && signedIn && !registeredEmail) router.replace(destinationFor(signedIn, !!staffProfile, redirect));
  }, [hydrated, signedIn, staffProfile, redirect, registeredEmail, router]);

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
        const signedUp = !!(response.data.data?.token && response.data.data?.user);
        if (signedUp) {
          useAuthStore.getState().setAuth(response.data.data.user, response.data.data.token);
        }
        // They were on their way somewhere (booking, a design): the new account is signed in, so carry on there.
        if (signedUp && redirect) {
          router.replace(redirect);
          return;
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

      {/* Main Container: mobile full edge-to-edge, tablet/desktop centered card */}
      <div className="flex-1 w-full sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-16">
        <div className="w-full min-h-dvh sm:min-h-0 sm:max-w-md bg-white px-5 py-6 sm:p-8 sm:rounded-2xl sm:border sm:border-line sm:shadow-sm">
          <Link
            href={withRedirect('/login', redirect)}
            aria-label="Back to sign in"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-muted transition-colors py-1.5 -ml-1 mb-4"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>

          <AuthBrand className="mb-5 sm:mb-8" />

          {registeredEmail ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <MailCheck size={32} />
              </div>
              <h1 className="text-display text-2xl text-ink mb-2">Account Created</h1>
              <p className="text-sm text-ink-muted mb-4 leading-relaxed">
                Welcome to SUTURA! Your customer account for
                <span className="block text-[15px] font-semibold text-ink break-words my-1.5">
                  {registeredEmail}
                </span>
                is ready.
              </p>
              <div className="text-xs text-ink-body mb-6 bg-sunken p-4 border border-line text-left space-y-2">
                <p>A welcome confirmation email has been dispatched to your inbox for your records.</p>
                <p>You are signed in. Start discovering shops, booking appointments, and tracking garments.</p>
              </div>
              <button
                type="button"
                onClick={() => router.replace(useAuthStore.getState().user ? '/' : withRedirect('/login', redirect, 'as=customer'))}
                className={PRIMARY_BTN}
              >
                {useAuthStore.getState().user ? 'Start exploring' : 'Proceed to Customer Sign In'}
              </button>
            </div>
          ) : (
            <>
              <AccountTypeTabs active="customer" />
              <h1 className="text-display text-2xl text-ink mb-6">Create Account</h1>

              {error && (
                <div role="alert" className={ERROR_BOX}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="register-full-name" className={LABEL}>
                    Full Name<span className="text-danger">*</span>
                  </label>
                  <input
                    id="register-full-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className={FIELD}
                    required
                  />
                </div>

                <GenderPicker value={gender} onChange={setGender} />

                <div>
                  <label htmlFor="register-email" className={LABEL}>
                    Email<span className="text-danger">*</span>
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. maria@gmail.com"
                    className={FIELD}
                    required
                  />
                </div>

                <div>
                  <div className="relative">
                    <label htmlFor="register-password" className={LABEL}>
                      Password<span className="text-danger">*</span>
                    </label>
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
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
                          <span className={met ? 'text-ink' : 'text-ink-muted'}>{rule.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <label htmlFor="register-password-confirm" className={LABEL}>
                    Confirm Password<span className="text-danger">*</span>
                  </label>
                  <input
                    id="register-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className={FIELD}
                    required
                  />
                </div>

                <TermsConsent agreed={agreed} onChange={setAgreed} audience="customers" />
                <button
                  type="submit"
                  disabled={loading || !agreed || !PASSWORD_RULES.every((r) => r.test(password))}
                  className={PRIMARY_BTN}
                >
                  {loading ? 'Creating account...' : 'Create an Account'}
                </button>
                {!loading && (!agreed || !PASSWORD_RULES.every((r) => r.test(password))) && (
                  <DisabledHint id="register-hint">{PASSWORD_RULES.every((r) => r.test(password)) ? 'Agree to the Terms to continue.' : 'Meet every password rule to continue.'}</DisabledHint>
                )}
              </form>

              <p className="mt-6 text-center text-sm text-ink">
                Already have an account?{' '}
                <a href={withRedirect('/login', redirect)} className="font-bold underline underline-offset-2">
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
