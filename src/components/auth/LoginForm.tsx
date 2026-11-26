'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import LoginPortalSwitch, { type LoginPortal } from './LoginPortalSwitch';
import PasswordField from './PasswordField';
import GoogleSignInButton, { OrDivider } from './GoogleSignInButton';
import { EMAIL_INPUT_PROPS, ERROR_BOX, FIELD, LABEL, OUTLINE_BTN, PRIMARY_BTN, TEXT_LINK, TITLE } from './authStyles';
import { signInError } from './signInError';
import { readAuth } from '@/lib/authStorage';
import { homeOf, rememberAccount } from '@/lib/savedAccounts';

interface LoginFormProps {
  /** Where a customer lands after signing in. null = stay on the current page (the modal case). */
  readonly customerRedirect: string | null;
  readonly staffRedirect?: string;
  readonly registerHref: string;
  /** Closes the modal after sign-in or when leaving via a link. */
  readonly onDone?: () => void;
  readonly titleId?: string;
  readonly initialPortal?: LoginPortal;
  /** The /login page keeps the address in step with the tab (/login vs /login?as=store). */
  readonly onPortalChange?: (portal: LoginPortal) => void;
  /** "Log in as Shop Owner" from a signed-in account: keep that account so the menu can switch back to it. */
  readonly addAccount?: boolean;
}

/** The one Sign In form: full page on /login, and inside LoginModal over the current page on tablet/desktop. */
export default function LoginForm({ customerRedirect, staffRedirect = '/dashboard', registerHref, onDone, titleId, initialPortal = 'customer', onPortalChange, addAccount = false }: LoginFormProps) {
  const [portal, setPortal] = useState<LoginPortal>(initialPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const currentName = useAuthStore((state) => state.user?.name);
  const keepCurrent = addAccount && !!currentName;
  const isShop = portal === 'store';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password, portal });
      if (!response.data.success) return;
      const { user, token, store, staff_profile } = response.data.data;
      const activeStore = store || staff_profile?.store;
      const roleNames: string[] = user?.roles?.map((r: { name: string }) => r.name) || [];
      const isShopAccount = roleNames.some((n) => ['store_owner', 'branch_manager', 'staff'].includes(n)) || !!staff_profile;
      if (!isShopAccount && !roleNames.includes('customer')) {
        setError('This account type does not have a dashboard yet. Please contact support.');
        return;
      }
      const added = { token, user, store: activeStore ?? null, staffProfile: staff_profile ?? null };
      const previous = keepCurrent ? readAuth() : null;
      if (previous && previous.user.id !== user.id) {
        rememberAccount(previous);
        rememberAccount(added);
      }
      setAuth(user, token, activeStore, staff_profile);
      onDone?.();
      // A second account: a full load, so nothing the first account fetched stays on screen.
      if (previous) {
        window.location.replace(homeOf(added));
        return;
      }
      // replace, not push: Back from where they land must not show the sign-in page again.
      // A new owner (signed up with their own email) has no shop yet: the application wizard comes first.
      if (roleNames.includes('store_owner') && !activeStore) router.replace('/onboarding');
      else if (isShopAccount) router.replace(staffRedirect);
      else if (customerRedirect) router.replace(customerRedirect);
    } catch (err) {
      setError(signInError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 id={titleId} className={`${TITLE} mb-6`}>Sign In</h1>

      <LoginPortalSwitch value={portal} onChange={(next) => { setPortal(next); setError(''); onPortalChange?.(next); }} />
      {isShop && <p className="-mt-3 mb-5 text-sm text-ink-muted">For shop owners, branch managers and staff.</p>}
      {keepCurrent && (
        <p className="mb-5 rounded-xl bg-sunken p-3 text-sm text-ink-body">
          You stay signed in as <span className="font-semibold">{currentName}</span>. Switch back any time from your account menu.
        </p>
      )}

      {error && <div role="alert" className={ERROR_BOX}>{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className={LABEL}>Email<span className="text-danger">*</span></label>
          <input id="login-email" {...EMAIL_INPUT_PROPS} autoComplete="username" placeholder="e.g. maria@gmail.com"
            value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} required />
        </div>

        <div>
          <PasswordField id="login-password" label="Password" value={password} onChange={setPassword}
            shown={showPassword} onToggle={() => setShowPassword((s) => !s)} autoComplete="current-password" />
          <div className="mt-1 flex justify-end">
            <Link href="/forgot-password" onClick={onDone} className={`${TEXT_LINK} text-sm font-medium`}>Forgot password?</Link>
          </div>
        </div>

        <button type="submit" disabled={loading} className={PRIMARY_BTN}>{loading ? 'Signing in…' : 'Sign In'}</button>
      </form>

      {/* Google is for customers only; shop accounts sign in with their email and password. Not offered when adding a
          second account: the Google round trip can't keep the account already signed in. */}
      {!isShop && !keepCurrent && (
        <>
          <OrDivider />
          <GoogleSignInButton redirectTo={customerRedirect} />
        </>
      )}

      <p className="mt-8 text-center text-sm text-ink-muted">{isShop ? 'New to SUTURA for shops?' : 'New to SUTURA?'}</p>
      <Link href={isShop ? '/signup/shop' : registerHref} onClick={onDone} className={`${OUTLINE_BTN} mt-3`}>
        {isShop ? 'Create a Shop Account' : 'Create an Account'}
      </Link>
      {isShop && (
        <Link href="/for-shops" onClick={onDone} className="mt-2 flex min-h-11 items-center justify-center text-sm text-ink-muted underline underline-offset-2 hover:text-ink">
          See how SUTURA works for shops
        </Link>
      )}
    </>
  );
}
