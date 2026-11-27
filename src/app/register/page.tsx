'use client';

import { Suspense, useEffect, useState } from 'react';
import { revealField } from '@/lib/revealField';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';
import { Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PublicNav from '@/components/shared/PublicNav';
import { PASSWORD_RULES } from '@/lib/passwordRules';
import { cleanName, nameError, NAME_HINT } from '@/lib/nameRules';
import { EMAIL_PATTERN, useAvailabilityCheck } from '@/components/store-application/useAvailabilityCheck';

const isEmailFormat = (v: string) => EMAIL_PATTERN.test(v);

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
  const redirectParam = searchParams.get('redirect');
  const wantsStore = searchParams.get('as') === 'store_owner';

  // First/Last Name only — no Middle Initial field, per explicit direction.
  // Joined into the single `name` string the backend actually expects
  // (RegisterRequest has no first_name/last_name columns to split into).
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (wantsStore) router.replace('/register/store');
  }, [wantsStore, router]);

  // Names: letters only (no digits/symbols) — dropped as typed or pasted,
  // with a short note when something was removed. Same rule on the server.
  const [nameDropped, setNameDropped] = useState<{ first: boolean; last: boolean }>({ first: false, last: false });
  const onNameChange = (which: 'first' | 'last', raw: string) => {
    const { value, changed } = cleanName(raw);
    setNameDropped((d) => ({ ...d, [which]: changed }));
    if (which === 'first') setFirstName(value); else setLastName(value);
  };
  const firstNameNote = nameError(firstName) || (nameDropped.first ? NAME_HINT : '');
  const lastNameNote = nameError(lastName) || (nameDropped.last ? NAME_HINT : '');
  const namesValid = !nameError(firstName) && !nameError(lastName);

  // Live "already registered?" check. Walk-in / guest placeholder accounts
  // come back available: signing up claims them (same rule as the server).
  const emailCheck = useAvailabilityCheck('email', email, isEmailFormat, '/auth/check-email');
  const emailMessage = (() => {
    switch (emailCheck.state) {
      case 'taken':
        return emailCheck.reason === 'shop_login'
          ? { tone: 'text-danger', text: 'Shop logins can’t be used for a customer account. Use your personal email.' }
          : { tone: 'text-danger', text: 'This email is already registered.' };
      case 'available': return { tone: 'text-emerald-700', text: 'Email is available' };
      case 'invalid': return { tone: 'text-ink-muted', text: 'Enter a valid email address, e.g. you@gmail.com.' };
      case 'checking': return { tone: 'text-ink-muted', text: 'Checking…' };
      default: return null;
    }
  })();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      setLoading(false);
      revealField('register-password-confirm');
      return;
    }

    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      const response = await api.post('/auth/register', {
        name, email, password, password_confirmation: passwordConfirmation, role
      });
      if (response.data.success) {
        if (response.data.data?.token && response.data.data?.user) {
          useAuthStore.getState().setAuth(response.data.data.user, response.data.data.token);
        }
        router.push(redirectParam || '/');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      // A field the server refused (e.g. email already used): take the person there.
      const bad = Object.keys(error.response?.data?.errors ?? {})[0];
      const FIELD_IDS: Record<string, string> = { name: 'register-first-name', email: 'register-email', password: 'register-password' };
      if (bad && FIELD_IDS[bad]) revealField(FIELD_IDS[bad]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* Reuses the site's own header instead of rebuilding the
          reference's — the user's explicit call: "meron na tayung header
          just use that." */}
      <PublicNav />

      {/* Hero banner mirrors the reference's structure (full-bleed photo +
          bold overlay line + close button), but the copy is rewritten to
          something SUTURA actually does — "unlock member privileges,
          birthday exclusives" is INDOCHINO's loyalty-program pitch, and
          this system has no such feature. */}
      <section className="relative h-[140px] shrink-0 overflow-hidden">
        <Image
          src="/images/auth_banner.jpg"
          alt="Tailoring Tools"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/20" />
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Close"
          className="absolute top-3 right-3 text-white"
        >
          <X size={22} />
        </button>
        <p className="absolute inset-x-0 bottom-0 px-[10px] pb-3 text-lg font-bold text-white leading-snug">
          Create an account to <span className="font-black">track your orders and book appointments</span> with verified stores.
        </p>
      </section>

      {/* Mobile: full page, edge-to-edge, same as before. Tablet/desktop:
          the form no longer stretches full-bleed under the hero banner —
          it sits centered in a modal-like card instead, matching
          login/page.tsx's existing md: breakpoint pattern so the two auth
          forms feel like the same product at any width. */}
      <div className="flex-1 px-[10px] py-6 md:flex md:items-start md:justify-center md:px-4 md:py-12">
        <div className="md:w-full md:max-w-md md:bg-surface md:border md:border-line md:shadow-sm md:p-8">
        <h1 className="text-display text-2xl text-ink mb-6">Create Account</h1>

        {error && (
          <div className="mb-5 p-3.5 border border-danger/30 bg-danger/5 text-danger text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="register-first-name" className="block text-sm text-ink mb-2">
              First Name<span className="text-danger">*</span>
            </label>
            <input
              id="register-first-name"
              type="text"
              autoComplete="given-name"
              maxLength={100}
              value={firstName}
              onChange={(e) => onNameChange('first', e.target.value)}
              onBlur={() => setFirstName((v) => v.trim())}
              aria-invalid={!!firstNameNote || undefined}
              aria-describedby={firstNameNote ? 'register-first-name-note' : undefined}
              className={`w-full px-3.5 py-3 border text-ink text-[15px] focus:outline-none transition-colors ${firstNameNote ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-ink'}`}
              required
            />
            {firstNameNote && <p id="register-first-name-note" role="status" className="mt-1.5 text-xs text-danger">{firstNameNote}</p>}
          </div>

          <div>
            <label htmlFor="register-last-name" className="block text-sm text-ink mb-2">
              Last Name<span className="text-danger">*</span>
            </label>
            <input
              id="register-last-name"
              type="text"
              autoComplete="family-name"
              maxLength={100}
              value={lastName}
              onChange={(e) => onNameChange('last', e.target.value)}
              onBlur={() => setLastName((v) => v.trim())}
              aria-invalid={!!lastNameNote || undefined}
              aria-describedby={lastNameNote ? 'register-last-name-note' : undefined}
              className={`w-full px-3.5 py-3 border text-ink text-[15px] focus:outline-none transition-colors ${lastNameNote ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-ink'}`}
              required
            />
            {lastNameNote && <p id="register-last-name-note" role="status" className="mt-1.5 text-xs text-danger">{lastNameNote}</p>}
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm text-ink mb-2">
              Email<span className="text-danger">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={emailCheck.checkNow}
              aria-invalid={emailCheck.state === 'taken' || undefined}
              aria-describedby={emailMessage ? 'register-email-status' : undefined}
              className={`w-full px-3.5 py-3 border text-ink text-[15px] focus:outline-none transition-colors ${
                emailCheck.state === 'taken'
                  ? 'border-danger focus:border-danger'
                  : emailCheck.state === 'available'
                    ? 'border-emerald-600 focus:border-emerald-600'
                    : 'border-line-strong focus:border-ink'
              }`}
              required
            />
            {emailMessage && (
              <p id="register-email-status" role="status" aria-live="polite" className={`mt-1.5 text-xs ${emailMessage.tone}`}>
                {emailMessage.text}
                {emailCheck.state === 'taken' && emailCheck.reason === 'taken' && (
                  <>
                    {' '}
                    <a href={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`} className="font-bold underline underline-offset-2">
                      Sign in instead
                    </a>
                  </>
                )}
              </p>
            )}
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
            disabled={loading || !namesValid || !PASSWORD_RULES.every((r) => r.test(password)) || emailCheck.state === 'taken' || emailCheck.state === 'checking'}
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
        </div>
      </div>
    </div>
  );
}
