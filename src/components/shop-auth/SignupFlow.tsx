'use client';

import AuthShell from './AuthShell';
import StitchSteps from './StitchSteps';
import AccountTypeTabs from './AccountTypeTabs';
import SignupEmailStep from './SignupEmailStep';
import SignupPasswordStep from './SignupPasswordStep';
import SignupInboxStep from './SignupInboxStep';
import VerifiedView from './VerifiedView';
import { useOwnerSignup, type SignupStep } from './useOwnerSignup';

const STEPS = ['Email', 'Password', 'Confirm'] as const;
const AT: Record<SignupStep, number> = { email: 1, password: 2, inbox: 3 };

/** /signup/shop: email + agreement → password → "check your inbox" → verified. The shop's details come after sign-in, in the onboarding wizard. */
export default function SignupFlow() {
  const s = useOwnerSignup();
  if (s.verified) return <AuthShell backLabel="For shops"><VerifiedView /></AuthShell>;

  return (
    <AuthShell backLabel="For shops">
      {s.step === 'email' && <AccountTypeTabs active="store" />}
      <StitchSteps steps={STEPS} current={AT[s.step]} label="Sign-up progress" />
      {s.step === 'email' && <SignupEmailStep s={s} />}
      {s.step === 'password' && <SignupPasswordStep s={s} />}
      {s.step === 'inbox' && <SignupInboxStep s={s} />}
    </AuthShell>
  );
}
