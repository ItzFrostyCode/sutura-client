'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import LoginForm from '@/components/auth/LoginForm';
import AuthBrand from '@/components/auth/AuthBrand';

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
      {/* No header bar here at any size (bottomNavPaths' AUTH_PATHS) — PublicNav only brings the bottom
          navigation, so Log In keeps the same layout as the Profile tab it was opened from. */}
      <PublicNav />

      {/* Mobile (below md): full page, edge-to-edge. Tablet/desktop normally
          get LoginModal over the current page instead; this card layout only
          shows when someone lands on /login directly (e.g. a ?redirect link). */}
      <div className="flex-1 px-[10px] py-6 md:flex md:items-start md:justify-center md:px-4 md:py-16">
        <div className="md:w-full md:max-w-md md:bg-surface md:border md:border-line md:shadow-sm md:p-8">
          <AuthBrand className="mb-8" />
          <LoginForm
            customerRedirect={redirectPath || '/'}
            staffRedirect={redirectPath || '/dashboard'}
            registerHref={redirectPath ? `/register?redirect=${encodeURIComponent(redirectPath)}` : '/register'}
            onClose={() => router.push('/')}
            initialPortal={initialPortal}
          />
        </div>
      </div>
    </div>
  );
}
