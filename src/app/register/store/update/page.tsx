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
        <div className="mx-auto w-full max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-taupe">Open a Shop</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Update your shop application</h1>
          <Suspense fallback={<p className="mt-8 text-sm text-ink-muted">Loading your application…</p>}>
            <UpdateApplication />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
