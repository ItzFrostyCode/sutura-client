'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PublicNav from '@/components/shared/PublicNav';
import ApplicationUpdateForm from '@/components/store-application/ApplicationUpdateForm';

// Opened from the "Request Changes" email. The owner isn't signed in (they
// can't be until approval) — the private ?token= link is the only key.
function UpdateApplication() {
  const token = useSearchParams().get('token') ?? '';
  return <ApplicationUpdateForm token={token} />;
}

export default function StoreApplicationUpdatePage() {
  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 mobile-screen-margins py-8 sm:py-12">
        <div className="mx-auto w-full max-w-2xl sm:border sm:border-line sm:bg-surface sm:p-8">
          <h1 className="mobile-h1 text-ink">Update your shop application</h1>
          <Suspense fallback={<p className="mt-6 text-sm text-ink-muted">Loading your application…</p>}>
            <UpdateApplication />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
