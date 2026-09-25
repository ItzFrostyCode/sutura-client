'use client';

import AccountHeader from '@/components/account/AccountHeader';

// A full-takeover screen rather than the usual "coming soon" card: this isn't a settings
// toggle, it's the start of a real onboarding flow the customer would walk
// through, so it gets its own focused space to grow into once the flow
// itself is built (mirrors /register's own account-type step conceptually,
// just not wired up yet on this side).
export default function BecomeShopOwnerPage() {
  return (
    <div>
      <AccountHeader title="Become a Shop Owner" backHref="/account" />
      <p className="text-sm text-ink-muted leading-relaxed">
        This is still being worked on — soon you&apos;ll be able to start your own tailoring shop on SUTURA right from here.
      </p>
    </div>
  );
}
