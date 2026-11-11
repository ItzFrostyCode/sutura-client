import Link from 'next/link';
import { Check } from 'lucide-react';
import { withRedirect } from '@/lib/authRedirect';
import { PRIMARY_BTN, TITLE } from './authStyles';
import type { RegisterResult } from './RegisterForm';

/** After Create Account: signed in → start exploring; not signed in (server sent no session) → sign in. Never both. */
export default function RegisterSuccess({ result, redirect }: { readonly result: RegisterResult; readonly redirect: string | null }) {
  return (
    <div className="py-2 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
        <Check size={30} aria-hidden />
      </div>
      <h1 className={`${TITLE} mb-2`}>Welcome to SUTURA</h1>
      <p className="text-base text-ink-muted">
        Your account for
        <span className="my-1.5 block break-words font-semibold text-ink">{result.email}</span>
        {result.signedIn ? 'is ready, and you are signed in.' : 'is ready. Sign in to start.'}
      </p>
      <p className="mb-6 mt-3 text-sm text-ink-muted">We also sent a welcome email to that address.</p>
      {result.signedIn ? (
        <Link href={redirect ?? '/'} replace className={PRIMARY_BTN}>Start Exploring</Link>
      ) : (
        <Link href={withRedirect('/login', redirect)} replace className={PRIMARY_BTN}>Sign In</Link>
      )}
    </div>
  );
}
