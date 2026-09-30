'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import LoginForm from '@/components/auth/LoginForm';

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
  // from (design / service / package / store) rather than an empty canvas.
  useEffect(() => {
    if (!redirectPath || initialPortal === 'store' || window.innerWidth < 768) return;
    const m = redirectPath.match(/^\/store\/([^/?]+)\/book(?:\?(.*))?$/);
    if (!m) return;
    const q = new URLSearchParams(m[2] ?? '');
    const context = q.get('ref_item_id') ? `/store/${m[1]}/catalog/${q.get('ref_item_id')}`
      : q.get('service_id') ? `/store/${m[1]}/service/${q.get('service_id')}`
      : q.get('package_id') ? `/store/${m[1]}/package/${q.get('package_id')}`
      : `/store/${m[1]}`;
    router.replace(`${context}?signin=1&redirect=${encodeURIComponent(redirectPath)}`);
  }, [redirectPath, initialPortal, router]);

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* PublicNav only on tablet/desktop — on mobile the form's own
          Sign In/X header is the only chrome this page needs, and having
          both stacked read as redundant. */}
      <div className="hidden md:block">
        <PublicNav />
      </div>

      {/* Mobile (below md): full page, edge-to-edge. Tablet/desktop normally
          get LoginModal over the current page instead; this card layout only
          shows when someone lands on /login directly (e.g. a ?redirect link). */}
      <div className="flex-1 px-[10px] py-6 md:flex md:items-start md:justify-center md:px-4 md:py-16">
        <div className="md:w-full md:max-w-md md:bg-surface md:border md:border-line md:shadow-sm md:p-8">
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
