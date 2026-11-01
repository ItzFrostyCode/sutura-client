'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useStoreApplication } from '@/components/store-application/useStoreApplication';
import OnboardingShell from './OnboardingShell';
import { ERROR_BOX } from '@/components/auth/authStyles';
import StitchSteps from '@/components/shop-auth/StitchSteps';
import IdentityStep from './IdentityStep';
import BusinessSteps from './BusinessSteps';
import OnboardingSubmitted from './OnboardingSubmitted';

const STEPS = ['Identity', 'Business', 'Review'] as const;

/**
 * What a new shop owner sees after confirming their email and signing in: identity, then the business (shop,
 * documents, plan or free trial), then "submitted for review". Reads the account's shop from the server, so someone
 * who already applied lands on the status step.
 */
export default function OnboardingWizard() {
  const router = useRouter();
  const { user, token, hydrated, setAuth } = useAuthStore();
  const app = useStoreApplication({ signedInOwner: true });
  const [checked, setChecked] = useState(false);
  const [submittedBefore, setSubmittedBefore] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) { router.replace('/login?as=store'); return; }
    api.get('/auth/me')
      .then((res) => {
        const d = res.data.data;
        setAuth(d.user, token, d.store ?? d.staff_profile?.store ?? undefined, d.staff_profile ?? undefined);
        if (!d.user.roles?.some((r: { name: string }) => r.name === 'store_owner')) router.replace('/');
        else if (d.store) setSubmittedBefore(true);
        setChecked(true);
      })
      .catch(() => router.replace('/login?as=store'));
  }, [hydrated, token, router, setAuth]);

  if (!checked || !user) return null;

  const done = app.submittedTo !== null || submittedBefore;
  const stepper = done ? 3 : app.step === 1 ? 1 : 2;

  return (
    <OnboardingShell>
      <StitchSteps steps={STEPS} current={stepper} label="Application progress" />
      {done ? <OnboardingSubmitted /> : (
        <>
          {app.step === 1 && (
            <>
              <h1 className="text-display text-2xl text-ink mb-2">Verify Your Identity</h1>
              <p className="mb-6 text-sm text-ink-muted leading-relaxed">Confirm you are the person responsible for this shop. You&apos;ll need your personal details now, and a valid government ID later.</p>
            </>
          )}
          {app.error && <div role="alert" className={ERROR_BOX}>{app.error}</div>}
          {app.step === 1 ? <IdentityStep app={app} /> : <BusinessSteps app={app} />}
        </>
      )}
    </OnboardingShell>
  );
}
