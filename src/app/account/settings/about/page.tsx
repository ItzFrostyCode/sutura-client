'use client';

import AccountHeader from '@/components/account/AccountHeader';
import SuturaLogo from '@/components/brand/SuturaLogo';

export default function AboutPage() {
  return (
    <div>
      <AccountHeader title="About" backHref="/account/settings" />

      <div className="bg-surface border border-line p-6 flex flex-col items-center text-center mb-4">
        <SuturaLogo className="h-12" />
        <p className="text-xs text-ink-muted mt-1">Web-Based Tailoring Shop Tracker System</p>
      </div>

      <div className="bg-surface border border-line p-5">
        <p className="text-xs text-ink-body leading-relaxed">
          SUTURA connects customers with tailoring stores across Davao City — search by garment specialization,
          book appointments, and track your order&apos;s production in real time, from cutting all the way to pickup.
        </p>
      </div>
    </div>
  );
}
