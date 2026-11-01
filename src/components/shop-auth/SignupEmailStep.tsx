'use client';

import Link from 'next/link';
import WhatYouNeed from './WhatYouNeed';
import TermsConsent from './TermsConsent';
import DisabledHint from './DisabledHint';
import IntentChip, { useShopIntentLabel } from './IntentChip';
import { FIELD, LABEL, PRIMARY_BTN } from './AuthShell';
import type { OwnerSignupState } from './useOwnerSignup';

export default function SignupEmailStep({ s }: { readonly s: OwnerSignupState }) {
  const intent = useShopIntentLabel();
  const emailOk = /^\S+@\S+\.\S+$/.test(s.email.trim());
  const ok = s.agreed && emailOk;
  return (
    <>
      <IntentChip label={intent.chip} />
      <h1 className="text-display text-2xl text-ink mb-2">Open a Shop</h1>
      <p className="mb-6 text-sm text-ink-muted">{intent.lede}</p>

      <form onSubmit={(e) => { e.preventDefault(); if (ok) s.goTo('password'); }} className="space-y-5">
        <div>
          <label htmlFor="su-email" className={LABEL}>Email<span className="text-danger">*</span></label>
          <input id="su-email" type="email" autoComplete="email" inputMode="email" placeholder="e.g. owner@gmail.com" required
            value={s.email} onChange={(e) => s.setEmail(e.target.value)} className={FIELD} />
          <p className="mt-1.5 text-xs text-ink-muted">We&apos;ll send a link to confirm it. Your account is created when you open it.</p>
        </div>
        <TermsConsent agreed={s.agreed} onChange={s.setAgreed} audience="owners" />
        <button type="submit" disabled={!ok} aria-describedby={ok ? undefined : 'su-email-hint'} className={PRIMARY_BTN}>Continue</button>
        {!ok && <DisabledHint id="su-email-hint">{emailOk ? 'Agree to the Terms to continue.' : 'Enter your email to continue.'}</DisabledHint>}
      </form>

      <WhatYouNeed />

      <p className="mt-6 text-center text-sm text-ink">
        Already have an account? <Link href="/login?as=store" className="font-bold underline underline-offset-2">Sign in</Link>
      </p>
    </>
  );
}
