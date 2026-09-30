'use client';

import Link from 'next/link';
import PublicNav from '@/components/shared/PublicNav';
import ApplicationStepper from '@/components/store-application/ApplicationStepper';
import OwnerStep from '@/components/store-application/OwnerStep';
import ShopStep from '@/components/store-application/ShopStep';
import DocumentsStep from '@/components/store-application/DocumentsStep';
import PlanStep from '@/components/store-application/PlanStep';
import ApplicationSubmitted from '@/components/store-application/ApplicationSubmitted';
import { useStoreApplication } from '@/components/store-application/useStoreApplication';

const STEP_COPY = {
  1: { title: 'About you', body: 'The shop owner’s details, and where we should send your shop login.' },
  2: { title: 'Your shop', body: 'What customers will see, and where to find you.' },
  3: { title: 'Verification documents', body: 'We check these before your shop goes live.' },
  4: { title: 'Choose a plan', body: 'Pick a plan and upload your payment receipt.' },
} as const;

// "Open a shop" application — ported from the sutura2 System Admin
// prototype's shop registration, now on this app's API and design system.
// Submitting does NOT sign anyone in: on approval the System Admin issues a
// shop login (…@sutura.shop) and temporary password, emailed to the owner.
export default function StoreApplicationPage() {
  const app = useStoreApplication();
  const copy = STEP_COPY[app.step];

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />

      <main className="flex-1 mobile-screen-margins py-8 sm:py-12">
        <div className="mx-auto w-full max-w-2xl sm:border sm:border-line sm:bg-surface sm:p-8">
          <p className="mobile-overline text-taupe">Open a Shop</p>
          <h1 className="mobile-h1 text-ink mt-2">Register your tailoring shop</h1>

          {app.submittedTo ? <ApplicationSubmitted email={app.submittedTo} /> : (
          <>
          <div className="mt-6">
            <ApplicationStepper current={app.step} />
          </div>

          <div className="mt-8 mb-6">
            <h2 className="mobile-h2 text-ink">{copy.title}</h2>
            <p className="mobile-body-md text-ink-muted mt-2">{copy.body}</p>
          </div>

          {app.error && (
            <div role="alert" className="mb-6 border border-danger/30 bg-danger/5 p-3.5 text-sm text-danger">
              {app.error}
            </div>
          )}

          {app.step === 1 && <OwnerStep app={app} />}
          {app.step === 2 && <ShopStep app={app} />}
          {app.step === 3 && <DocumentsStep app={app} />}
          {app.step === 4 && <PlanStep app={app} />}

          <p className="mt-8 text-center text-sm text-ink">
            Already approved?{' '}
            <Link href="/login?as=store" className="font-bold underline underline-offset-2">Sign in to your shop</Link>
          </p>
          </>
          )}
        </div>
      </main>
    </div>
  );
}
