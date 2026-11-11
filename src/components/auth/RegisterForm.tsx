'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import GenderPicker, { type Gender } from '@/components/shared/GenderPicker';
import AccountTypeTabs from '@/components/shop-auth/AccountTypeTabs';
import TermsConsent from '@/components/shop-auth/TermsConsent';
import DisabledHint from '@/components/shop-auth/DisabledHint';
import { meetsPasswordRules } from '@/lib/passwordRules';
import { EMAIL_TAKEN_MESSAGE, isEmailTaken } from '@/lib/checkEmail';
import { withRedirect } from '@/lib/authRedirect';
import PasswordField from './PasswordField';
import GoogleSignInButton, { OrDivider } from './GoogleSignInButton';
import { signInError } from './signInError';
import { EMAIL_INPUT_PROPS, ERROR_BOX, FIELD, LABEL, PRIMARY_BTN, TITLE } from './authStyles';

export interface RegisterResult { readonly email: string; readonly signedIn: boolean }

/** Customer sign-up: Google in one tap, or name + email + password. Shop owners use the Shop tab (/signup/shop). */
export default function RegisterForm({ redirect, onRegistered }: { readonly redirect: string | null; readonly onRegistered: (r: RegisterResult) => void }) {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [shown, setShown] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rulesOk = meetsPasswordRules(password);
  const matches = confirm.length > 0 && confirm === password;
  const ready = fullName.trim() !== '' && !emailTaken && rulesOk && matches && agreed;
  const hint = !fullName.trim() ? 'Enter your full name to continue.'
    : !rulesOk ? 'Meet every password rule to continue.'
    : !matches ? 'Type the same password again to continue.'
    : !agreed ? 'Agree to the Terms to continue.' : '';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ready || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', {
        name: fullName.trim(), email: email.trim(), password, password_confirmation: confirm, role: 'customer', gender: gender || null,
      });
      if (!res.data.success) return;
      const { token, user } = res.data.data ?? {};
      if (token && user) useAuthStore.getState().setAuth(user, token);
      onRegistered({ email: email.trim(), signedIn: !!(token && user) });
    } catch (err) {
      if ((err as { response?: { data?: { errors?: { email?: string[] } } } }).response?.data?.errors?.email) setEmailTaken(true);
      else setError(signInError(err, 'We couldn’t create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AccountTypeTabs active="customer" />
      <h1 className={`${TITLE} mb-2`}>Create Account</h1>
      <p className="mb-6 text-base text-ink-muted">Book appointments and follow your orders from any shop.</p>

      <GoogleSignInButton redirectTo={redirect} />
      <OrDivider />

      {error && <div role="alert" className={ERROR_BOX}>{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="register-full-name" className={LABEL}>Full name<span className="text-danger">*</span></label>
          <input id="register-full-name" type="text" autoComplete="name" autoCapitalize="words" placeholder="e.g. Maria Santos"
            value={fullName} onChange={(e) => setFullName(e.target.value)} className={FIELD} required />
        </div>

        <div>
          <label htmlFor="register-email" className={LABEL}>Email<span className="text-danger">*</span></label>
          <input id="register-email" {...EMAIL_INPUT_PROPS} autoComplete="email" placeholder="e.g. maria@gmail.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailTaken) setEmailTaken(false); }}
            onBlur={async () => { if (email.trim()) setEmailTaken(await isEmailTaken(email)); }}
            aria-invalid={emailTaken || undefined} aria-describedby={emailTaken ? 'register-email-error' : undefined}
            className={FIELD} required />
          {emailTaken && (
            <p id="register-email-error" role="alert" className="mt-1.5 text-sm text-danger">
              {EMAIL_TAKEN_MESSAGE}{' '}
              <Link href={withRedirect('/login', redirect)} className="font-semibold underline underline-offset-2">Sign in instead</Link>, or use a different email.
            </p>
          )}
        </div>

        <PasswordField id="register-password" label="Password" value={password} onChange={setPassword}
          shown={shown} onToggle={() => setShown((s) => !s)} autoComplete="new-password" disabled={emailTaken} withRules />
        <PasswordField id="register-password-confirm" label="Confirm password" value={confirm} onChange={setConfirm}
          shown={shown} autoComplete="new-password" disabled={emailTaken} matchWith={password} />

        <GenderPicker value={gender} onChange={setGender} />

        <TermsConsent agreed={agreed} onChange={setAgreed} audience="customers" />
        <button type="submit" disabled={!ready || loading} aria-describedby={hint ? 'register-hint' : undefined} className={PRIMARY_BTN}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        {hint && !loading && !emailTaken && <DisabledHint id="register-hint">{hint}</DisabledHint>}
      </form>

      <p className="mt-8 text-center text-sm text-ink">
        Already have an account?{' '}
        <Link href={withRedirect('/login', redirect)} className="font-semibold underline underline-offset-2">Sign in</Link>
      </p>
    </>
  );
}
