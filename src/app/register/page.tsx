'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthPage from '@/components/auth/AuthPage';
import RegisterForm, { type RegisterResult } from '@/components/auth/RegisterForm';
import RegisterSuccess from '@/components/auth/RegisterSuccess';
import { useLeaveAuth } from '@/components/auth/useLeaveAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { destinationFor, safeRedirect } from '@/lib/authRedirect';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leave = useLeaveAuth();
  // Customers only. Shop owners sign up at /signup/shop; old ?as=store_owner links are forwarded there.
  const wantsStore = searchParams.get('as') === 'store_owner';
  const redirect = safeRedirect(searchParams.get('redirect'));
  const [result, setResult] = useState<RegisterResult | null>(null);
  const { user, staffProfile, hydrated } = useAuthStore();

  useEffect(() => { if (wantsStore) router.replace('/signup/shop'); }, [wantsStore, router]);

  // Already signed in (Back, or an old link): go on, and take this page out of the history.
  useEffect(() => {
    if (hydrated && user && !result) router.replace(destinationFor(user, !!staffProfile, redirect));
  }, [hydrated, user, staffProfile, redirect, result, router]);

  const onRegistered = (r: RegisterResult) => {
    // On their way somewhere (booking, a design) and now signed in: carry straight on.
    if (r.signedIn && redirect) { router.replace(redirect); return; }
    setResult(r);
  };

  return (
    <AuthPage close={{ onClick: leave, label: 'Close create account' }}>
      {result ? <RegisterSuccess result={result} redirect={redirect} /> : <RegisterForm redirect={redirect} onRegistered={onRegistered} />}
    </AuthPage>
  );
}
