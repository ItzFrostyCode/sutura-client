import type { Metadata } from 'next';
import VerifyEmailScreen from '@/components/shop-auth/VerifyEmailScreen';

export const metadata: Metadata = { title: 'Confirm your email · SUTURA', referrer: 'no-referrer' };

export default function VerifyEmailPage() {
  return <VerifyEmailScreen />;
}
