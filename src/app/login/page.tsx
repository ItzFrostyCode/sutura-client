'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AuthPage from '@/components/auth/AuthPage';
import LoginForm from '@/components/auth/LoginForm';
import { useLeaveAuth } from '@/components/auth/useLeaveAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { destinationFor, safeRedirect, withRedirect } from '@/lib/authRedirect';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-canvas"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = safeRedirect(searchParams.get('redirect'));
  const initialPortal = searchParams.get('as') === 'store' ? 'store' : 'customer';
  // ?add=1: "Log in as Shop Owner" from a signed-in customer — a second account, the first one stays.
  const addAccount = searchParams.get('add') === '1';
  const { user, staffProfile, hydrated } = useAuthStore();
  const leave = useLeaveAuth();

  // Already signed in (Back from the page they were sent to, or an old link): go on, and take this page out of history.
  useEffect(() => {
    if (hydrated && user && !addAccount) router.replace(destinationFor(user, !!staffProfile, redirectPath));
  }, [hydrated, user, staffProfile, redirectPath, router, addAccount]);

  // Tablet/desktop customers sent here to book get the Sign In modal over the page they came from instead.
  useEffect(() => {
    if (!redirectPath || initialPortal === 'store' || window.innerWidth < 768) return;
    const m = redirectPath.match(/^\/store\/([^/?]+)\/book(?:\?(.*))?$/);
    if (!m) return;
    const q = new URLSearchParams(m[2] ?? '');
    const context = q.get('ref_item_id') ? `/store/${m[1]}/catalog/${q.get('ref_item_id')}`
      : q.get('service_id') ? `/store/${m[1]}/service/${q.get('service_id')}`
      : `/store/${m[1]}`;
    router.replace(`${context}?signin=1&redirect=${encodeURIComponent(redirectPath)}`);
  }, [redirectPath, initialPortal, router]);

  return (
    <AuthPage close={{ onClick: leave, label: 'Close sign in' }}>
      <LoginForm
        customerRedirect={redirectPath || '/'}
        staffRedirect={redirectPath?.startsWith('/dashboard') ? redirectPath : '/dashboard'}
        registerHref={withRedirect('/register', redirectPath)}
        initialPortal={initialPortal}
        addAccount={addAccount}
        onPortalChange={(next) => {
          const extra = [next === 'store' ? 'as=store' : null, addAccount ? 'add=1' : null].filter(Boolean).join('&');
          router.replace(withRedirect('/login', redirectPath, extra || undefined));
        }}
      />
    </AuthPage>
  );
}
