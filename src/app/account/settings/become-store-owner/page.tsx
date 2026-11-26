'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import AccountHeader from '@/components/account/AccountHeader';

const STEPS = [
  'Fill in the application: you, your shop and your business documents',
  'Choose a plan: pay with GCash, or start with 14 days free',
  'The SUTURA team reviews it. Once approved, we email your shop login and a temporary password',
] as const;

// Entry point into the shop application (/register/store, same as the team lead's). The shop gets its own login
// (…@sutura.shop) from the System Admin on approval, so this customer email can still receive it.
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
          Your shop gets its own sign-in (like yourshop@sutura.shop). You can use this same email to receive it.
        </p>
      </div>
      <Link href="/register/store" className="mt-6 flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80">
        Start Application
      </Link>
    </div>
  );
}
