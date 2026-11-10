'use client';

import { useState } from 'react';
import { meetsPasswordRules } from '@/lib/passwordRules';
import PasswordField from '@/components/auth/PasswordField';
import DisabledHint from './DisabledHint';
import { ERROR_BOX, PRIMARY_BTN, TITLE } from './AuthShell';
import type { OwnerSignupState } from './useOwnerSignup';

export default function SignupPasswordStep({ s }: { readonly s: OwnerSignupState }) {
  const [shown, setShown] = useState(false);
  const match = s.confirm.length > 0 && s.password === s.confirm;
  const ok = meetsPasswordRules(s.password) && match;

  return (
    <>
      <h1 className={`${TITLE} mb-2`}>Set Your Password</h1>
      <p className="mb-5 text-base text-ink-muted">You&apos;ll use it with your email to sign in.</p>

      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-line bg-sunken px-3.5 py-2">
        <span className="min-w-0 truncate text-base text-ink">{s.email}</span>
        <button type="button" onClick={s.changeEmail} className="flex min-h-11 shrink-0 items-center px-1 text-sm font-medium text-ink underline underline-offset-2">Change</button>
      </div>

      {s.error && <div role="alert" className={ERROR_BOX}>{s.error}</div>}

      <form onSubmit={(e) => { e.preventDefault(); if (ok && !s.busy) s.submit(); }} className="space-y-5">
        {/* Hidden username so password managers save the password against this email. */}
        <input type="email" name="username" autoComplete="username" value={s.email} readOnly hidden />
        <PasswordField id="su-pass" label="Password" value={s.password} onChange={s.setPassword}
          shown={shown} onToggle={() => setShown((v) => !v)} autoComplete="new-password" withRules />
        <PasswordField id="su-confirm" label="Confirm password" value={s.confirm} onChange={s.setConfirm}
          shown={shown} autoComplete="new-password" matchWith={s.password} />
        <button type="submit" disabled={!ok || s.busy} aria-describedby={ok ? undefined : 'su-pass-hint'} className={PRIMARY_BTN}>
          {s.busy ? 'Sending link…' : 'Create Account'}
        </button>
        {!ok && !s.busy && <DisabledHint id="su-pass-hint">{meetsPasswordRules(s.password) ? 'Type the same password again to continue.' : 'Meet every password rule to continue.'}</DisabledHint>}
      </form>
    </>
  );
}
