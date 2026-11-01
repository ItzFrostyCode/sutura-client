import type { Metadata } from 'next';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata: Metadata = { title: 'Set up your shop · SUTURA' };

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
