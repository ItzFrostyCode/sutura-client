'use client';

import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { ERROR_BOX, OUTLINE_BTN, TITLE } from './AuthShell';
import type { OwnerSignupState } from './useOwnerSignup';

export default function SignupInboxStep({ s }: { readonly s: OwnerSignupState }) {
  return (
    <div className="text-center py-2">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-line-strong bg-sunken text-espresso"><MailCheck size={30} /></div>
      <h1 className={`${TITLE} mb-2`}>Check Your Inbox</h1>
      <p className="text-sm text-ink-muted leading-relaxed">
        We sent a link to
        <span className="my-1.5 block break-words text-[15px] font-semibold text-ink">{s.email}</span>
        Your account is created when you open it. This page updates on its own once you do.
      </p>

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-muted" role="status">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        {s.expired ? 'The link has expired. Send a new one below.' : 'Waiting for you to open the link…'}
      </p>
      {s.error && <div role="alert" className={`${ERROR_BOX} mt-4`}>{s.error}</div>}

      <p className="mt-6 text-sm text-ink">
        Didn&apos;t get it? Check spam, or{' '}
        {s.resendIn > 0
          ? <span className="text-ink-muted">resend in {s.resendIn}s</span>
          : <button type="button" onClick={s.resend} className="font-bold underline underline-offset-2">resend the link</button>}
      </p>

      {/* Typed the wrong email, or one with no inbox? Start again with another. Nothing was made for this one:
          the account only exists once the link is opened. */}
      <button type="button" onClick={s.changeEmail} className={`${OUTLINE_BTN} mt-5`}>Use a different email</button>
      <p className="mt-4 text-sm text-ink-muted">
        Already opened the link? <Link href="/login?as=store" className="font-bold text-ink underline underline-offset-2">Sign in</Link>
      </p>
    </div>
  );
}
