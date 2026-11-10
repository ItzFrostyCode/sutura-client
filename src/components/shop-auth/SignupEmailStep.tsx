'use client';

import Link from 'next/link';
import WhatYouNeed from './WhatYouNeed';
import ForShopsLink from './ForShopsLink';
import TermsConsent from './TermsConsent';
import DisabledHint from './DisabledHint';
import IntentChip, { useShopIntentLabel } from './IntentChip';
import { EMAIL_INPUT_PROPS, FIELD, LABEL, PRIMARY_BTN, TITLE } from './AuthShell';
import type { OwnerSignupState } from './useOwnerSignup';

export default function SignupEmailStep({ s }: { readonly s: OwnerSignupState }) {
  const intent = useShopIntentLabel();
  const emailOk = /^\S+@\S+\.\S+$/.test(s.email.trim());
  const ok = s.agreed && emailOk && !s.emailError && !s.checking;
  return (
    <>
      <IntentChip label={intent.chip} />
      <h1 className={`${TITLE} mb-2`}>{intent.title}</h1>
      <p className="mb-6 text-base text-ink-muted">{intent.lede}</p>

      <form onSubmit={(e) => { e.preventDefault(); if (ok) s.continueFromEmail(); }} className="space-y-5">
        <div>
          <label htmlFor="su-email" className={LABEL}>Email<span className="text-danger">*</span></label>
          <input id="su-email" {...EMAIL_INPUT_PROPS} autoComplete="email" placeholder="e.g. owner@gmail.com" required
            aria-invalid={!!s.emailError} aria-describedby={s.emailError ? 'su-email-error' : undefined}
            value={s.email} onChange={(e) => s.setEmail(e.target.value)} className={`${FIELD} ${s.emailError ? 'border-danger' : ''}`} />
          {s.emailError ? (
            <p id="su-email-error" role="alert" className="mt-1.5 text-sm text-danger">
              {s.emailError} Already your shop&apos;s account? <Link href="/login?as=store" className="font-bold underline underline-offset-2">Sign in</Link>.
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-ink-muted">Use your shop&apos;s own email, not one you use as a customer. We&apos;ll send a link to confirm it.</p>
          )}
        </div>
        <TermsConsent agreed={s.agreed} onChange={s.setAgreed} audience="owners" />
        <button type="submit" disabled={!ok} aria-describedby={ok ? undefined : 'su-email-hint'} className={PRIMARY_BTN}>{s.checking ? 'Checking…' : 'Continue'}</button>
        {!ok && !s.emailError && !s.checking && <DisabledHint id="su-email-hint">{emailOk ? 'Agree to the Terms to continue.' : 'Enter your email to continue.'}</DisabledHint>}
      </form>

      <WhatYouNeed />

      <p className="mt-6 text-center text-sm text-ink">
        Already have an account? <Link href="/login?as=store" className="font-bold underline underline-offset-2">Sign in</Link>
      </p>
      <ForShopsLink />
    </>
  );
}
