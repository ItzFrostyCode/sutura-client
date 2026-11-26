'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';

const STEPS = [
  'Sign up with your shop’s email and confirm it',
  'Tell us about your shop and send your business documents',
  'The SUTURA team reviews them — your 14 free days start when your shop is approved',
] as const;

// Entry point into shop sign-up (/signup/shop: email first, then the application after signing in). A shop is its own
// login, reviewed by the System Admin, so it can't reuse this customer account's email — the copy says so up front.
export default function BecomeShopOwnerPage() {
  return (
    <div>
      <AccountHeader title="Become a Shop Owner" backHref="/account" />
      <div className="card-soft p-5">
        <p className="mobile-body-md text-ink-body">Open your tailoring shop on SUTURA, so customers can find you on the map and follow their orders.</p>
        <ol className="mt-4 space-y-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-taupe-dark">{i + 1}</span>
              <span className="mobile-body-sm pt-1 text-ink-body">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mobile-body-sm mt-4 flex items-start gap-2 rounded-xl bg-sunken p-3 text-ink-body">
          <Check size={16} className="mt-0.5 shrink-0 text-taupe-dark" aria-hidden />
          Use a different email from this customer account — your shop gets its own sign-in.
        </p>
      </div>
      <Link href="/signup/shop" className="mt-6 flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80">
        Start Shop Sign-Up
      </Link>
    </div>
  );
}
