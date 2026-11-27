'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
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
  4: { title: 'Choose a plan', body: 'Pick a plan and how you want to pay with GCash.' },
} as const;

// "Open a shop" application — ported from the sutura2 System Admin
// prototype's shop registration, now on this app's API and design system.
// Submitting does NOT sign anyone in: on approval the System Admin issues a
// shop login (…@sutura.shop) and temporary password, emailed to the owner.
export default function StoreApplicationPage() {
  // The answers survive a refresh; leaving the page starts it fresh next time.
  const app = useStoreApplication({ keepDraft: true });
  const copy = STEP_COPY[app.step];

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />

      <main className="flex-1 mobile-screen-margins py-8 sm:py-6 short:py-4">
        <div className="mx-auto w-full max-w-2xl">
          {/* On a short screen (1366×768, a tablet on its side) the eyebrow goes, so step 1 fits unscrolled. */}
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-taupe short:hidden">Open a shop</p>
          <h1 className="mt-1.5 short:mt-0 text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[30px] short:text-[26px]">Register your tailoring shop</h1>

          {app.submittedTo ? <ApplicationSubmitted email={app.submittedTo} freeTrial={app.freeTrial} /> : (
          <>
          <div className="mt-6 sm:mt-4">
            <ApplicationStepper current={app.step} />
          </div>

          <div className="mt-8 mb-5 sm:mt-5 sm:mb-4 short:mt-4 short:mb-3">
            <h2 className="text-[22px] font-bold tracking-tight text-ink">{copy.title}</h2>
            <p className="mt-1 text-[15px] text-ink-muted">{copy.body}</p>
          </div>

          {app.error && (
            <div id="app-error" role="alert" className="mb-5 flex scroll-mt-24 items-start gap-2.5 rounded-2xl bg-danger/10 p-4 text-[15px] text-danger">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{app.error}</span>
            </div>
          )}

          {app.step === 1 && <OwnerStep app={app} />}
          {app.step === 2 && <ShopStep app={app} />}
          {app.step === 3 && <DocumentsStep app={app} />}
          {app.step === 4 && <PlanStep app={app} />}

          {/* Step 1 shows this beside Continue instead. */}
          {app.step !== 1 && (
          <p className="mt-10 text-center text-[15px] text-ink-muted sm:mt-6">
            Already approved?{' '}
            <Link href="/login?as=store" className="font-semibold text-ink underline underline-offset-2">Sign in to your shop</Link>
          </p>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
