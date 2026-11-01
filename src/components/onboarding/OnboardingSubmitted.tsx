'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { PRIMARY_BTN } from '@/components/shop-auth/AuthShell';

/** Last step: where the application stands. It reads the shop's status, so it is right after a refresh or a later sign-in too. */
export default function OnboardingSubmitted() {
  const store = useAuthStore((s) => s.store);
  const status = store?.status ?? 'pending';
  const approved = status === 'approved';
  const rejected = status === 'rejected';
  const Icon = approved ? CheckCircle2 : rejected ? XCircle : Clock;
  const tone = approved ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : rejected ? 'border-danger/30 bg-danger/5 text-danger' : 'border-amber-300 bg-amber-50 text-amber-700';
  const name = store?.name ? <strong className="font-semibold text-ink">{store.name}</strong> : 'your shop';

  return (
    <div className="text-center py-2">
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border ${tone}`}><Icon size={30} /></div>
      <h1 className="text-display text-2xl text-ink mb-2">{approved ? 'Your Shop Is Live' : rejected ? 'Application Not Approved' : 'Submitted for Review'}</h1>
      <p className="mx-auto mb-6 max-w-md text-sm text-ink-muted leading-relaxed">
        {approved && <>{name} has been approved. You can open your dashboard now.</>}
        {rejected && (store?.rejection_reason || 'The team could not approve this application. Contact SUTURA support for details.')}
        {!approved && !rejected && <>The SUTURA team is checking {name}. We will email you at your sign-in address when it is approved, and your free trial starts then.</>}
      </p>
      <Link href="/dashboard" className={PRIMARY_BTN}>{approved ? 'Open Dashboard' : 'See My Application'}</Link>
    </div>
  );
}
