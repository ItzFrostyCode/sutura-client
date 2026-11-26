import type { Metadata } from 'next';
import SignupFlow from '@/components/shop-auth/SignupFlow';

export const metadata: Metadata = { title: 'Sign up · SUTURA for shops' };

export default function ShopSignupPage() {
  return <SignupFlow />;
}
