'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';
import { Check, X } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <RegisterPageContent />
    </Suspense>
  );
}

// Mirrors AppServiceProvider's Password::defaults() (min 8, mixed case, a
// number, a symbol) exactly — this is a live UI checklist for a real server
// rule, not decorative copy that happens to look similar.
const PASSWORD_RULES = [
  { key: 'length', label: '8+ characters', test: (p: string) => p.length >= 8 },
  {
    key: 'numberSymbol',
    label: 'At least 1 number and a special character',
    test: (p: string) => /\d/.test(p) && /[^A-Za-z0-9]/.test(p),
  },
  {
    key: 'case',
    label: 'At least 1 lowercase and uppercase letter',
    test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p),
  },
];

function RegisterPageContent() {
  const searchParams = useSearchParams();
  // No visible account-type picker — the entry point decides it instead:
  // the header's "Start a Store" link sends ?as=store_owner, plain "Sign Up"
  // (from the account menu) registers as a customer, matching how a real
  // shopper vs. a store owner actually arrive at this form.
  const role = searchParams.get('as') === 'store_owner' ? 'store_owner' : 'customer';

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
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      const response = await api.post('/auth/register', {
        name, email, password, password_confirmation: passwordConfirmation, role
      });
      if (response.data.success) {
        router.push('/login?registered=true');
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

      <div className="flex-1 px-[10px] py-6">
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3.5 py-3 border border-line-strong text-ink text-[15px] focus:outline-none focus:border-ink transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="register-last-name" className="block text-sm text-ink mb-2">
              Last Name<span className="text-danger">*</span>
            </label>
            <input
              id="register-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3.5 py-3 border border-line-strong text-ink text-[15px] focus:outline-none focus:border-ink transition-colors"
              required
            />
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
      </div>
    </div>
  );
}
