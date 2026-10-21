'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import LoginForm from '@/components/auth/LoginForm';
import AuthBrand from '@/components/auth/AuthBrand';
import { useAuthStore } from '@/store/useAuthStore';
import { destinationFor, withRedirect } from '@/lib/authRedirect';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const initialPortal = searchParams.get('as') === 'store' ? 'store' : 'customer';
  const { user, staffProfile, hydrated } = useAuthStore();

  // Already signed in (Back from the page they were sent to, or an old link): go on to where they belong, and take
  // this page out of the history so Back does not return to it.
  useEffect(() => {
    if (hydrated && user) router.replace(destinationFor(user, !!staffProfile, redirectPath));
  }, [hydrated, user, staffProfile, redirectPath, router]);

  // Tablet/desktop customers sent here to book get the Sign In modal over the page they came
  // from (design / service / store) rather than an empty canvas.
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
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />

      {/* Mobile: full edge-to-edge without margins. Tablet/desktop: centered card on canvas. */}
      <div className="flex-1 w-full sm:flex sm:items-start sm:justify-center sm:px-4 sm:py-16">
        <div className="w-full min-h-dvh sm:min-h-0 sm:max-w-md bg-white px-5 py-6 sm:p-8 sm:border sm:border-line sm:shadow-sm">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-muted transition-colors py-1.5 -ml-1 mb-4"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>

          <AuthBrand className="mb-8" />
          <LoginForm
            customerRedirect={redirectPath || '/'}
            staffRedirect={redirectPath || '/dashboard'}
            registerHref={withRedirect('/register', redirectPath)}
            onClose={() => router.push('/')}
            initialPortal={initialPortal}
          />
        </div>
      </div>
    </div>
  );
}
