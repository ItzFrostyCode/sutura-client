'use client';

import { useState } from 'react';
import { meetsPasswordRules } from '@/lib/passwordRules';
import PasswordChecklist from './PasswordChecklist';
import DisabledHint from './DisabledHint';
import { ERROR_BOX, FIELD, LABEL, PRIMARY_BTN, SHOW_BTN } from './AuthShell';
import type { OwnerSignupState } from './useOwnerSignup';

export default function SignupPasswordStep({ s }: { readonly s: OwnerSignupState }) {
  const [show, setShow] = useState(false);
  const match = s.confirm.length > 0 && s.password === s.confirm;
  const ok = meetsPasswordRules(s.password) && match;

  return (
    <>
      <h1 className="text-display text-2xl text-ink mb-2">Set Your Password</h1>
      <p className="mb-5 text-sm text-ink-muted">You&apos;ll use it with your email to sign in.</p>

      <div className="mb-5 flex items-center justify-between gap-3 border border-line bg-sunken px-3.5 py-3">
        <span className="min-w-0 truncate text-sm text-ink">{s.email}</span>
        <button type="button" onClick={s.changeEmail} className="flex min-h-11 shrink-0 items-center px-1 text-sm text-ink underline underline-offset-2">Change</button>
      </div>

      {s.error && <div role="alert" className={ERROR_BOX}>{s.error}</div>}

      <form onSubmit={(e) => { e.preventDefault(); if (ok && !s.busy) s.submit(); }} className="space-y-5">
        <div>
          <div className="relative">
            <label htmlFor="su-pass" className={LABEL}>Password<span className="text-danger">*</span></label>
            <input id="su-pass" type={show ? 'text' : 'password'} autoComplete="new-password" required value={s.password}
              onChange={(e) => s.setPassword(e.target.value)} className={`${FIELD} pr-20`} />
            <button type="button" onClick={() => setShow(!show)} className={SHOW_BTN}>{show ? 'Hide' : 'Show'}</button>
          </div>
          <PasswordChecklist password={s.password} />
        </div>
        <div>
          <label htmlFor="su-confirm" className={LABEL}>Confirm Password<span className="text-danger">*</span></label>
          <input id="su-confirm" type={show ? 'text' : 'password'} autoComplete="new-password" required value={s.confirm}
            onChange={(e) => s.setConfirm(e.target.value)} className={FIELD} />
          {s.confirm.length > 0 && <p className={`mt-1.5 text-xs ${match ? 'text-sage' : 'text-danger'}`}>{match ? 'Passwords match' : 'Passwords do not match yet'}</p>}
        </div>
        <button type="submit" disabled={!ok || s.busy} aria-describedby={ok ? undefined : 'su-pass-hint'} className={PRIMARY_BTN}>{s.busy ? 'Sending link...' : 'Create Account'}</button>
        {!ok && !s.busy && <DisabledHint id="su-pass-hint">{meetsPasswordRules(s.password) ? 'Type the same password again to continue.' : 'Meet every password rule to continue.'}</DisabledHint>}
      </form>
    </>
  );
}
