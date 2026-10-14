'use client';

import Link from 'next/link';
import AccountHeader from '@/components/account/AccountHeader';

// Entry point into the shop application (/register/store). A shop is its
// own login, reviewed by the System Admin, so it can't reuse this customer
// account's email — the copy says so up front rather than letting the
// applicant hit that error on the last step.
export default function BecomeStoreOwnerPage() {
  return (
    <div>
      <AccountHeader title="Become a Store Owner" backHref="/account" />
      <div className="card-soft p-5">
        <p className="mobile-body-md text-ink-body">
          Apply to open your tailoring shop on SUTURA. You&apos;ll upload your business documents and choose a plan, and
          our team will review your application before your shop goes live.
        </p>
        <p className="mobile-body-sm mt-4 text-ink-muted">
          Your shop gets its own sign-in, so use a business email that isn&apos;t already linked to this customer account.
        </p>
      </div>
      <Link href="/register/store" className="mt-6 flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80">
        Start Application
      </Link>
    </div>
  );
}
